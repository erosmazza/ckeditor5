/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module engine/model/operation/insertoperation
 */

import Operation from './operation.js';
import Position from '../position.js';
import NodeList from '../nodelist.js';
import RemoveOperation from './removeoperation.js';
import writer from './../writer.js';
import { normalizeNodes } from './../writer.js';
import Text from '../text.js';
import Element from '../element.js';

/**
 * Operation to insert one or more nodes at given position in the model.
 *
 * @extends module:engine/model/operation/operation~Operation
 */
export default class InsertOperation extends Operation {
	/**
	 * Creates an insert operation.
	 *
	 * @param {module:engine/model/position~Position} position Position of insertion.
	 * @param {module:engine/model/node~NodeSet} nodes The list of nodes to be inserted.
	 * @param {Number} baseVersion {@link module:engine/model/document~Document#version} on which operation can be applied.
	 */
	constructor( position, nodes, baseVersion ) {
		super( baseVersion );

		/**
		 * Position of insertion.
		 *
		 * @readonly
		 * @member {module:engine/model/position~Position} module:engine/model/operation/insertoperation~insertOperation#position
		 */
		this.position = Position.createFromPosition( position );

		/**
		 * List of nodes to insert.
		 *
		 * @readonly
		 * @member {module:engine/model/nodelist~NodeList} module:engine/model/operation/insertoperation~insertOperation#nodeList
		 */
		this.nodes = new NodeList( normalizeNodes( nodes ) );
	}

	/**
	 * @inheritDoc
	 */
	get type() {
		return 'insert';
	}

	/**
	 * @inheritDoc
	 * @returns {module:engine/model/operation/insertoperation~insertOperation}
	 */
	clone() {
		const nodes = new NodeList( [ ...this.nodes ].map( ( node ) => node.clone( true ) ) );

		return new InsertOperation( this.position, nodes, this.baseVersion );
	}

	/**
	 * @inheritDoc
	 * @returns {module:engine/model/operation/removeoperation~RemoveOperation}
	 */
	getReversed() {
		return new RemoveOperation( this.position, this.nodes.maxOffset, this.baseVersion + 1 );
	}

	/**
	 * @inheritDoc
	 */
	_execute() {
		// What happens here is that we want original nodes be passed to writer because we want original nodes
		// to be inserted to the model. But in InsertOperation, we want to keep those nodes as they were added
		// to the operation, not modified. For example, text nodes can get merged or cropped while Elements can
		// get children. It is important that InsertOperation has the copy of original nodes in intact state.
		const originalNodes = this.nodes;
		this.nodes = new NodeList( [ ...originalNodes ].map( ( node ) => node.clone( true ) ) );

		const range = writer.insert( this.position, originalNodes );

		return { range };
	}

	/**
	 * @inheritDoc
	 */
	static get className() {
		return 'engine.model.operation.InsertOperation';
	}

	/**
	 * Creates `InsertOperation` object from deserilized object, i.e. from parsed JSON string.
	 *
	 * @param {Object} json Deserialized JSON object.
	 * @param {module:engine/model/document~Document} document Document on which this operation will be applied.
	 * @returns {module:engine/model/operation/insertoperation~insertOperation}
	 */
	static fromJSON( json, document ) {
		let children = [];

		for ( let child of json.nodes ) {
			if ( child.name ) {
				// If child has name property, it is an Element.
				children.push( Element.fromJSON( child ) );
			} else {
				// Otherwise, it is a Text node.
				children.push( Text.fromJSON( child ) );
			}
		}

		return new InsertOperation( Position.fromJSON( json.position, document ), children, json.baseVersion );
	}
}
