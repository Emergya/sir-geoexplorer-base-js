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

Viewer.widgets.EditionToolbar = Ext.extend(Ext.Toolbar, {

    /** i18n **/
    tooltipSelectFeature: "Select Feature",
    tooltipAddTag: "Add Tag to Map",
    tooltipAddPoint: "Add Point to Map",
    tooltipAddLine: "Add Line to Map",
    tooltipAddPolygon: "Add Polygon to Map",
    tooltipAddBuffer: "Create a new buffer",
    tooltipAddNewElement: "Create a new element",
    tooltipModifyFeature: "Modify feature",
    tooltipAddColumn: "Add new Column to selected layer",
    tooltipDeleteColumn: "Delete column from selected layer",

    constructor: function(config) {

        this.tools = [];

        // Workaround for FeatureEditor plugin to work out Composer.js
        this.doAuthorized = window.app.doAuthorized;
        this.isAuthorized = window.app.isAuthorized;

        this.plugins = [ {
            ptype : "vw_featureeditor",
            modifyOnly : true,
            tooltip: this.tooltipModifyFeature,
            featureManager: "featuremanager",
            actionTarget: 'editiontbar',
            toggleGroup : "globalToggle",
            supportAbstractGeometry: true,
            supportNoGeometry: true,
            autoLoadFeature: true,
            showSelectedOnly : true
        },{
            ptype: 'gxp_selectfeature',
            id: "featureselector",
            actionTarget: 'editiontbar',
            tooltip: this.tooltipSelectFeature,
            toggleGroup: "globalToggle",
            featureManager: "featuremanager"
        },{
            ptype: 'gxp_addtagtomap',
            id: 'addtagtomap',
            actionTarget: 'editiontbar',
            addTagToMapTooltipText: this.tooltipAddTag,
            titlePrompt: "Añadir etiqueta",
            promptText: "Inserte el texto de la etiqueta",
            toggleGroup: "globalToggle"
        }, {
            ptype: 'gxp_addfeaturetomap',
            id: 'addpointtomap',
            actionTarget: 'editiontbar',
            tooltip: this.tooltipAddPoint,
            iconCls: 'vw-icon-add-point',
            geometryTypes: ["Point"],
            geometryHandler: OpenLayers.Handler.Point,
            featureManager: "featuremanager",
            toggleGroup: "globalToggle"
        }, {
            ptype: 'gxp_addfeaturetomap',
            id: 'addlinetomap',
            actionTarget: 'editiontbar',
            tooltip: this.tooltipAddLine,
            iconCls: 'vw-icon-add-line',
            geometryTypes: ["Line", "Curve"],
            geometryHandler: OpenLayers.Handler.Path,
            featureManager: "featuremanager",
            toggleGroup: "globalToggle"
        }, {
            ptype: 'gxp_addfeaturetomap',
            id: 'addpolygontomap',
            actionTarget: 'editiontbar',
            tooltip: this.tooltipAddPolygon,
            iconCls: 'vw-icon-add-polygon',
            geometryTypes: ["Polygon", "Surface"],
            geometryHandler: OpenLayers.Handler.Polygon,
            featureManager: "featuremanager",
            toggleGroup: "globalToggle"
        }, {
            ptype: 'gxp_createbuffer',
            actionTarget: 'editiontbar',
            tooltip: this.tooltipAddBuffer,
            featureSelector: "featureselector"
        },{
            ptype: "gxp_deleteselectedfeatures",
            actionTarget: "editiontbar",
            featureManager: "featuremanager"
        }, {
            ptype: 'gxp_newelementfromcoords',
            actionTarget: 'editiontbar',
            tooltip: this.tooltipAddNewElement,
            toggleGroup: "globalToggle"
        }, {
            ptype: 'gxp_adddatacolumn',
            actionTarget: 'editiontbar',
            tooltip: this.tooltipAddColumn,
            toggleGroup: "editionTools"
        }, {
            ptype: 'gxp_deletedatacolumn',
            actionTarget: 'editiontbar',
            tooltip: this.tooltipDeleteColumn,
            toggleGroup: "editionTools"
        }];

        Viewer.widgets.EditionToolbar.superclass.constructor.call(this, Ext.apply({
            id: 'editiontbar',
            cls: 'viewer_editiontoolbar'
        }, config));
    },

    /** private: method[getPluginById]*/
    getPlugin: function(id_plugin) {
        var plugin = null;
        for (var i = 0; i < this.plugins.length; i++) {
            if (this.plugins[i].id && this.plugins[i].id == id_plugin) {
                plugin = this.plugins[i];
                break;
            }
        }
        return plugin;
    }

});

Ext.reg('viewer_editiontoolbar', Viewer.widgets.EditionToolbar);