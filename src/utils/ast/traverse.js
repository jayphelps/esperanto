import estraverse from 'estraverse';
import disallowIllegalReassignment from './disallowIllegalReassignment';
import replaceIdentifiers from './replaceIdentifiers';
import rewriteExportAssignments from './rewriteExportAssignments';

export default function traverseAst ( ast, body, identifierReplacements, readOnlyNames, exportNames, alreadyExported, indentExclusionRanges ) {
	var scope, blockScope, capturedUpdates;

	scope = ast._scope;
	blockScope = ast._blockScope;

	capturedUpdates = null;

	// scope is now the global scope
	estraverse.traverse( ast, {
		enter: function ( node, parent ) {
			// we're only interested in references, not property names etc
			if ( node._skip ) return this.skip();

			if ( node._scope ) {
				scope = node._scope;
			} else if ( node._blockScope ) {
				blockScope = node._blockScope;
			}

			// Special case: if you have a variable declaration that updates existing
			// bindings as a side-effect, e.g. `var a = b++`, where `b` is an exported
			// value, we can't simply append `exports.b = b` to the update (as we
			// normally would) because that would be syntactically invalid. Instead,
			// we capture the change and update the export (and any others) after the
			// variable declaration
			if ( node.type === 'VariableDeclaration' ) {
				let previous = capturedUpdates;
				capturedUpdates = [];
				capturedUpdates.previous = previous;
			}

			// Catch illegal reassignments
			disallowIllegalReassignment( node, readOnlyNames, scope );

			// Rewrite assignments to exports
			rewriteExportAssignments( body, node, exportNames, scope, identifierReplacements, alreadyExported, ~ast.body.indexOf( parent ), capturedUpdates );

			// Replace identifiers
			replaceIdentifiers( body, node, identifierReplacements, scope );

			// Add multi-line strings to exclusion ranges
			if ( node.type === 'TemplateLiteral' ) {
				indentExclusionRanges.push([ node.start, node.end ]);
			}
		},

		leave: function ( node ) {
			// Special case - see above
			if ( node.type === 'VariableDeclaration' ) {
				if ( capturedUpdates.length ) {
					body.replace( node.end, node.end, capturedUpdates.map( c => ` exports.${c.name} = ${c.exportAs};` ).join( '' ) );
				}

				capturedUpdates = capturedUpdates.previous;
			}

			if ( node._scope ) {
				scope = scope.parent;
			} else if ( node._blockScope ) {
				blockScope = blockScope.parent;
			}
		}
	});
}