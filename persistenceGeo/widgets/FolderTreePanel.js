/*
 * FolderTreePanel.js Copyright (C) 2013 This file is part of PersistenceGeo project
 *
 * This software is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * As a special exception, if you link this library with other files to
 * produce an executable, this library does not by itself cause the
 * resulting executable to be covered by the GNU General Public License.
 * This exception does not however invalidate any other reasons why the
 * executable file might be covered by the GNU General Public License.
 *
 * Authors: Alejandro Diaz Torres (mailto:adiaz@emergya.com)
 */

/** api: (define)
 *  module = PersistenceGeo.widgets
 *  class = FolderTreePanel
 */
Ext.namespace("PersistenceGeo.widgets");

/**
 * Class: PersistenceGeo.widgets.FolderTreePanel
 *
 * Tree folder tree panel for persistence geo
 *
 */
PersistenceGeo.widgets.FolderTreePanel = Ext.extend(Ext.tree.TreePanel, {

    /** api: ptype = pgeo_folder_tree_panel */
    ptype: "pgeo_folder_tree_panel",

    /** api: url = {0}/persistenceGeo/tree/treeServiceMap */
    url: '{0}/persistenceGeo/tree/treeServiceMap',

    /** api: nodeTypesUrl = {0}/persistenceGeo/tree/getNodeTypes/{1} */
    nodeTypesUrl: '{0}/persistenceGeo/tree/getNodeTypes/{1}',

    /** api: restBaseUrl = rest */
    restBaseUrl: "rest",

    /** api: FILTER_TYPES */
    FILTER_TYPES: {
        SHOW_FOLDER_LAYERS: 'SHOW_FOLDER_LAYERS',
        SHOW_UNASSIGNED_FOLDER: 'SHOW_UNASSIGNED_FOLDER'
    },

    /** api: NODE_TYPES */
    NODE_TYPES: {
        FOLDER: 'FolderDto',
        CHANNEL_ROOT: 'channelsRoot',
        ZONES_ROOT: 'zonesRoot',
        LAYER: "LayerDto"
    },

    /**
     * api: KNOWN_FOLDER_TYPES
     *  ``Map``
     *  All Known folder types

        sir-admin_db-> select * from gis_folder_type;
         id | folder_type | folder_type_parent_id 
        ----+-------------+-----------------------
          1 | Canal       |        9              
          7 | Carpeta     |        9              
          8 | IPT         |  
          9 | DEFAULT     |  
    */
    KNOWN_FOLDER_TYPES:{
        CHANNEL_TYPE: 1,
        FOLDER_TYPE: 7,
        IPT_TYPE: 8,
        DEFAULT_TYPE: 9
    },

    /** api: config[recursive]
     *  ``Boolean``
     *  Show more than first level.
     */
    recursive: false,
    /** api: config[showVirtualFolder]
     *  ``Boolean``
     *  Show virtual folder with unasigned layers.
     */
    showVirtualFolder: true,
    /** api: config[showNodeTypes]
     *  ``Boolean``
     *  Show node types in the first level.
     */
    showNodeTypes: false,
    /** api: config[folderType]
     *  ``Integer``
     *  Identifier of the folderType to show.
     */
    folderType: null,

    /** api: config[rootNodeText]
     *  ``String``
     *  Test to show in the first level.
     */
    rootNodeText: 'Channels',

    /** api: config[rootVisible]
     *  ``Boolean``
     *  <tt>true</tt> to show the root node (defaults to <tt>false</tt>
     */
    rootVisible: false,

    /* Array of items to be refresh in panel reload */
    itemsArray: [],

    constructor: function (config) {

        Ext.apply(this, config);

        this.itemsArray = new Array();

        PersistenceGeo.widgets.FolderTreePanel.superclass.constructor.call(this, Ext.apply({
            border: false,
            autoScroll: true,
            loader: new Ext.tree.TreeLoader({
                dataUrl: String.format(this.url, this.restBaseUrl),
                nodeParameter: 'node',
                listeners: {
                    beforeload: function (treeLoader, node) {
                        if (node.attributes.type !== undefined) {
                            treeLoader.baseParams.type = node.attributes.type;
                        }
                        if (node.attributes.filter !== undefined) {
                            treeLoader.baseParams.filter = node.attributes.filter;
                        } else {
                            delete treeLoader.baseParams.filter;
                        }
                    },
                    load: function (treeLoader, node, action) {
                        var json = Ext.util.JSON.decode(action.responseText);
                        var i = 0;
                        for (i = 0; i < json.results; i++) {
                            // We need to modify ids because layers and folders might
                            // share id, as they are different entities, and that
                            // creates problems with the selection model of the tree,
                            // that assume just one type of data (nodes) with mutually
                            // exclusive identifiers.
                            var nodeIsLeaf = json.data[i].leaf;
                            var id= json.data[i].id;
                            if(nodeIsLeaf) {
                                id+=10000000;
                            }
                            node.appendChild(new Ext.tree.AsyncTreeNode({                                    
                                id: id,
                                text: this.parseNodeTitle(json.data[i].text),
                                leaf: nodeIsLeaf || !this.recursive,
                                type: json.data[i].type,
                                data: json.data[i].data
                            }));
                        }
                    },
                    scope: this
                }
            }),
            root: this.getRootNode()
        }, config));

        this.on({
            beforeappend: this.onBeforeAppend,
            scope: this
        });

        this.addEvents({
            nodeLoaded: true
        });
    },        

    /** api: function[getRootFilter]
     *  ``String``
     *  Obtain the root filter to apply.
     */
    getRootNode: function(){
        var rootNode;
        if(this.showNodeTypes){
            rootNode = new Ext.tree.TreeNode({
                id: 'root',
                text: 'Root',
                expanded: true
            });
            this.getFolderSubTypes();
        }else{
            rootNode = new Ext.tree.TreeNode({
                id: 'root',
                text: this.rootNodeText,
                leaf: false,
                type: this.folderType,
                filter: this.getRootFilter(),
                expanded: true
            });
            this.itemsArray.push(rootNode);
        }

        return rootNode;
    },

    getFolderSubTypes: function() {
        Ext.Ajax.request({
            url: String.format(this.nodeTypesUrl, this.restBaseUrl, this.folderType),   
            method: 'GET',
            disableCaching: false,
            success: function (response, request){
                var jsonObject = JSON.parse(response.responseText);
                for(el in jsonObject){
                    if(!!jsonObject[el].id && !!jsonObject[el].type){

                      instrType = jsonObject[el].title || jsonObject[el].type;
                      
                      var item = new Ext.tree.AsyncTreeNode({                                    
                            id: 'node-' + jsonObject[el].type,
                            text: instrType,
                            leaf: jsonObject[el].leaf || !this.recursive,
                            type: jsonObject[el].id,
                            data: jsonObject[el].data,
                            filter: this.getRootFilter()
                        });
                      this.itemsArray.push(item);
                      this.root.appendChild(item);
                    }
                }
                this.reload();
            },
            scope: this 
        });
    },

    /** api: function[getRootFilter]
     *  ``String``
     *  Obtain the root filter to apply.
     */
    getRootFilter: function(){
        var rootFilter = null;
        if (this.recursive) {
            rootFilter = this.FILTER_TYPES.SHOW_FOLDER_LAYERS;
        }
        if(this.showVirtualFolder){
            if(rootFilter != null){
                rootFilter += ","+this.FILTER_TYPES.SHOW_UNASSIGNED_FOLDER;
            }else{
                rootFilter = this.FILTER_TYPES.SHOW_UNASSIGNED_FOLDER;
            }
        }
        return rootFilter;
    },

    parseNodeTitle: function (text) {
        var result = text;
        if (text) {
            var components = text.split(":");
            if (components.length > 1) {
                result = components[1];
            } else {
                result = text;
            }
            result = result.replace(/_/g, " ");
        }
        return result;

    },

    reload: function () {
        if(this.itemsArray.length > 0){
            for(var i=0; i<this.itemsArray.length; i++){
                this.loader.load(this.itemsArray[i], function() {}, this);
            }
        }
    },

    onBeforeAppend: function (tree, parent, node) {
       
        if (node.attributes.type === this.NODE_TYPES.LAYER) {
            node.attributes.checked = false;
        }
    },

    onNodeLoaded: function (treeLoader, node, response) {
        this.fireEvent('nodeLoaded', treeLoader, node);            
    }


});

Ext.preg(PersistenceGeo.widgets.FolderTreePanel.prototype.ptype, PersistenceGeo.widgets.FolderTreePanel);