/*
 * FolderTreeWindow.js Copyright (C) 2013 This file is part of PersistenceGeo project
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

/**
 * @requires persistenceGeo/widgets/FolderTreePanel.js
 */

/** api: (define)
 *  module = PersistenceGeo.widgets
 *  class = FolderTreeWindow
 */
Ext.namespace("PersistenceGeo.widgets");

/**
 * Class: PersistenceGeo.widgets.FolderTreeWindow
 *
 * Tree folder window for persistence geo
 *
 */
PersistenceGeo.widgets.FolderTreeWindow = Ext.extend(Ext.Window, {

    /** api: ptype = pgeo_folder_tree_window */
    ptype: "pgeo_folder_tree_window",

    /** Default window size **/
    width: 500,
    height: 400,

    /** Default layout **/
    layout: 'fit',

    /** Default close action **/
    closeAction: 'hide',

    /** Styling **/
    bodyCssClass: 'vw-channel-window',
    cls: 'channel-tools-window',

    /** i18n **/
    title: 'Folder tree',

    /** api: config[showZones]
     *  ``Boolean``
     *  Show zones node.
     */
    showZones: true,
     
    /** api: config[showLayers]
     *  ``Boolean``
     *  Show layers node.
     */
    showLayers: false,

    /** api: config[allFolders]
     *  ``Boolean``
     *  Retrieve all folders if true, just default type folders if not.
     */
    allFolders: false,

    /** api: config[recursive]
     *  ``Boolean``
     *  Show folders recursively.
     */
    recursive: false,
     
    /** api: config[restBaseUrl]
     *  ``String``
     *  Root rest component URL.
     */
    restBaseUrl: "rest",

    /** api: config[persistenceGeoContext]
     *  ``PersistenceGeo.Context``
     *  Actual context loaded.
     */
    persistenceGeoContext: null,
     
    /** private: config[LOAD_FOLDER_URL]
     *  ``String``
     *  Relative url to load a folder.
     */
    LOAD_FOLDER_URL: '{0}/persistenceGeo/loadFoldersById/',

    /** api: config[onlyFolders]
     *  ``Boolean``
     *  Only show this types of nodes
     */
    onlyFolders: null,

    /** api: config[leafAsCheckbox]
     *  ``Boolean``
     *  Draw leaf nodes as a checkbox. Default it's true.
     */
    leafAsCheckbox: true,

    /** private: method[constructor]
     *  Contructor method.
     */
    constructor: function (config) {

        // Call superclass constructor
        PersistenceGeo.widgets.FolderTreeWindow.superclass.constructor.call(this, config);

        // Add default callbacks
        this.on({
            beforerender: this.onBeforeRender,
            show: this._onShow,
            scope: this
        });

        // Load restBaseUrl and LOAD_FOLDER_URL parameters
        this.restBaseUrl = this.persistenceGeoContext.defaultRestUrl;
        this.LOAD_FOLDER_URL = String(this.LOAD_FOLDER_URL, this.restBaseUrl);

         // add any custom application events
        this.addEvents(
            /** api: event[beforerender]
             *  Fires when before render this widget.
             */
            "beforerender",

            /** api: event[show]
             *  Fires when this widget is shown.
             */
            "show",

            /** api: event[treenodeclick]
             *  Fired before the a tree node element is clicked
             *
             *  Listeners arguments:
             *
             *  * node  - ``Ext.tree.Node`` node clicked
             *  * checked  - ``Boolean`` the check value
             */
            "treenodeclick",

            /** api: event[treenoedeloaded]
             *  Fired before the a tree node element is clicked
             *
             *  Listeners arguments:
             *
             *  * node  - ``Ext.tree.Node`` node loaded.
             *  * selectionModel  - ``Ext.tree.SelectionModel`` the selection model of the tree containing the node.
             */
            "treenoedeloaded"
        );
    },

    /** private: method[onBeforeRender]
     *  Before render method.
     */
    onBeforeRender: function () {

        var nodeTypesFilter = null;
        if(this.onlyFolders){
            nodeTypesFilter = {};
            nodeTypesFilter[PersistenceGeo.widgets.FolderTreePanel.prototype.NODE_TYPES.FOLDER] = true;
        }

        this.layersTree = new PersistenceGeo.widgets.FolderTreePanel({
            restBaseUrl: this.restBaseUrl,
            recursive: this.recursive,
            rootNodeText:this.titleText,
            rootVisible: false,
            folderType: this.allFolders?PersistenceGeo.widgets.FolderTreePanel.prototype.KNOWN_FOLDER_TYPES.ANY_FOLDER_TYPE:null,
            nodeTypesAllowed: nodeTypesFilter,
            showVirtualFolder: true,
            leafAsCheckbox: this.leafAsCheckbox,
            listeners: {
                click: this.onTreeNodeClick,
                nodeloaded: this.onTreeNodeLoaded,
                scope: this
            }
        });       
        this.add(this.layersTree);
    },

    /** private: method[_onShow]
     *  Called when this widget is shown.
     */
    _onShow: function () {
        this.layersTree.reload();
    },

    showLoading: function (show) {
        //TODO: Show a loading mask...
    },

    /** private: method[onTreeNodeClick]
     *  Called when a tree node element is clicked.
     */
    onTreeNodeClick: function (node, checked) {
        this.fireEvent("treenodeclick", node, checked);
    },

    onTreeNodeLoaded: function(nodeloader, node) {
        this.fireEvent("treenodeloaded", node, this.layersTree.getSelectionModel());
    },

    /** api: method[setShowLayers]
     *  Refresh layer tree.
     */
    setShowLayers: function (showLayers) {
        this.showLayers = showLayers;
        this.layersTree.reload();
    }
});

Ext.preg(PersistenceGeo.widgets.FolderTreeWindow.prototype.ptype, PersistenceGeo.widgets.FolderTreeWindow);