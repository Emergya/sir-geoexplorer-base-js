/**
 * Copyright (C) 2012
 *
 * This file is part of the project ohiggins
 *
 * This software is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option) any
 * later version.
 *
 * This software is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this library; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * As a special exception, if you link this library with other files to produce
 * an executable, this library does not by itself cause the resulting executable
 * to be covered by the GNU General Public License. This exception does not
 * however invalidate any other reasons why the executable file might be covered
 * by the GNU General Public License.
 *
 * Author: Antonio Hernández <ahernandez@emergya.com>
 */

(function() {

//var TREE_SERVICE_URL = 'http://localhost/ptools-layers.php';
//var TREE_SERVICE_URL = 'rest/persistenceGeo/treeService';

var TREE_SERVICE_URL = '{0}/persistenceGeo/treeService';

Viewer.dialog.PlanificationToolsLayersWindow = Ext.extend(Ext.Window, {

    layersTree: null,
    restBaseUrl: null,

    constructor: function(config) {

        config = config || {};
        this.restBaseUrl = config.restBaseUrl;

        Viewer.dialog.PlanificationToolsLayersWindow.superclass.constructor.call(this, Ext.apply({
            title: 'Instrumentos de Planificación Territorial (IPT)',
            width: 320,
            height: 400,
            layout: 'fit',
            closeAction: 'hide',
            cls: 'planification-layers-window'
        }, config));

        this.addEvents({
            checkChanged: true
        });

        this.on({
            beforerender: this.onBeforeRender,
            show: this._onShow,
            scope: this
        });
    },

    _onShow: function() {
        this.layersTree.reload();
    },

    onCancelButtonClicked: function() {
        this.hide();
    },

    onTreeNodeCheckChanged: function(node, checked) {
        var checkedNodes = this.layersTree.getChecked();
        this.fireEvent('checkChanged', node, checked, checkedNodes);
    },

    onBeforeRender: function() {

        var padding = 'padding: 10px 16px;';
        var border = 'border: 0px solid transparent;'
        
        this.layersTree = new Viewer.widgets.PlanificationToolsLayersTree({
            restBaseUrl: this.restBaseUrl,
            listeners: {
                checkchange: this.onTreeNodeCheckChanged,
                scope: this
            }
        });
        
        var c = {
            layout: 'fit',
            items: this.layersTree,
            buttons: [
                this.btnClose = new Ext.Button({
                    text: 'Cerrar',
                    listeners: {
                        click: this.onCancelButtonClicked,
                        scope: this
                    }
                })
            ]
        };

        this.add(c);
    }

});

Ext.reg('viewer_planification_tools_layers_windowtree', Viewer.dialog.PlanificationToolsLayersWindow);


Viewer.widgets.PlanificationToolsLayersTree = Ext.extend(Ext.tree.TreePanel, {

    // Planos comunales
    prcNode: null,

    // Planos intercomunales
    priNode: null,
    // rest component
    restBaseUrl: "rest",

    constructor: function(config) {

        Ext.apply(this, config);

        var rootNode = new Ext.tree.TreeNode({
            id: 'root',
            text: 'Root',
            expanded: true
        });

        // Planos comunales
        rootNode.appendChild(this.prcNode = new Ext.tree.TreeNode({
            id: 'node-prc',
            text: 'Planos Reguladores Comunales (PRC)',
            leaf: false,
            type: 'prc',
            expanded: true
        }));

        // Planos intercomunales
        rootNode.appendChild(this.priNode = new Ext.tree.TreeNode({
            id: 'node-pri',
            text: 'Planos Reguladores Intercomunales (PRI)',
            leaf: false,
            type: 'pri',
            expanded: true
        }));

        Viewer.widgets.PlanificationToolsLayersTree.superclass.constructor.call(this, Ext.apply({
            border: false,
            autoScroll: true,
            loader: new Ext.tree.TreeLoader({
                dataUrl: String.format(TREE_SERVICE_URL, this.restBaseUrl),
                listeners: {
                    load: this.onNodeLoaded,
                    beforeload: function(treeLoader, node) {
                        var params = ['type', 'filter'];
                        for (var i = 0, len = params.length; i<len; i++) {
                            var param = params[i];
                            if (node.attributes[param] !== undefined) {
                                treeLoader.baseParams[param] = node.attributes[param];
                            } else {
                                delete treeLoader.baseParams[param];
                            }
                        }
                    },
                    scope: this
                }
            }),
            root: rootNode,
            rootVisible: false
        }, config));

        this.on({
            beforeappend: this.onBeforeAppend,
            scope: this
        });

        this.addEvents({
            nodeLoaded: true
        });
    },

    reload: function() {
        this.loader.load(this.prcNode, function() {}, this);
        this.loader.load(this.priNode, function() {}, this);
    },

    onBeforeAppend: function(tree, parent, node) {
        if (node.isLeaf()) {
            node.attributes.checked = false;
        }
        var s = node.text.split(':');
        node.text = s.length > 1 ? s[1] : node.text;
    },

    onNodeLoaded: function(treeLoader, node, response) {
        this.fireEvent('nodeLoaded', treeLoader, node);
    }

});

Ext.reg('viewer_planification_tools_layers_tree', Viewer.widgets.PlanificationToolsLayersTree);

})();
