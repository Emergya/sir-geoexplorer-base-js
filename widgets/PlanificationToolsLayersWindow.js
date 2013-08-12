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

        this.layersTree = new PersistenceGeo.widgets.FolderTreePanel({
            restBaseUrl: this.restBaseUrl,
            recursive: true,
            folderType: PersistenceGeo.widgets.FolderTreePanel.prototype.KNOWN_FOLDER_TYPES.IPT_TYPE,
            rootNodeText: this.title,
            showVirtualFolder: false,
            showNodeTypes: true,
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

})();