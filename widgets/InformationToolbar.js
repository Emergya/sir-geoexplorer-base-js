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

Viewer.widgets.InformationToolbar = Ext.extend(Ext.Toolbar, {
	
	/** i18n **/
	tooltipDefaultSearches: "Default Searches",
	tooltipLengthMeasure: "Measure length selection or drawing a polyline",
	tooltipAreaMeasure: "Measure area drawing or selecting a polygon",
  tooltipPerimeterMeasure:"Measure perimeter drawing or selecting a polygon", 
	tooltipQueryLayer: "Query Layer",
	tooltipPointInformation: "Point Information",
	tooltipMetadataLayer: "Show metadata information",
	
    constructor: function(config) {

        Ext.apply(this, config);

        // Needed so the tools are accesible by CustomMeasure's parent ClickableFeatures.
        this.tools = app.tools;

        this.plugins = [{
            ptype: 'gxp_defaultsearches',
            actionTarget: 'informationtbar',
            tooltip: this.tooltipDefaultSearches,
            toggleGroup: 'globalToggle'
        },{
            ptype: 'gxp_custommeasure',
            iconCls: "gxp-icon-measure-length",
            tooltip: this.tooltipLengthMeasure,
            actionTarget: 'informationtbar',
            toggleGroup: 'globalToggle',
            measureMode: "LENGTH"
        },{
            ptype: 'gxp_custommeasure',
            iconCls: "gxp-icon-measure-perimeter",
            tooltip: this.tooltipPerimeterMeasure,
            actionTarget: 'informationtbar',
            toggleGroup: 'globalToggle',
            measureMode: "PERIMETER"
        },{
            ptype: 'gxp_custommeasure',
            iconCls: "gxp-icon-measure-area",
            tooltip: this.tooltipAreaMeasure,
            actionTarget: 'informationtbar',
            toggleGroup: 'globalToggle',
            measureMode: "AREA"
        },{
            ptype: "vw_queryform",
            featureManager: "querymanager",
            autoExpand: "query",
            actionTarget: "informationtbar",
            outputTarget: "query",
            target: this,
            queryMenutext: 'Consultar la capa seleccionada',
            queryActionTip: this.tooltipQueryLayer
        }, {
            ptype: 'gxp_pointinformation',
            actionTarget: 'informationtbar',
            tooltip: this.tooltipPointInformation,
            toggleGroup: 'globalToggle'
        }
        // , {
        //     ptype: 'vw_wmsgetfeatureinfo',
        //     format: 'grid',
        //     showButtonText: false,
        //     infoActionTip: 'Información de elementos',
        //     popupTitle: 'Información de elementos',
        //     buttonText: 'Información de elementos',
        //     actionTarget: ['informationtbar']
        // }
        ];

        Viewer.widgets.InformationToolbar.superclass.constructor.call(this, Ext.apply({
            id: 'informationtbar',
            cls: 'viewer_informationtoolbar'
        }, config));
    }

});

Ext.reg('viewer_informationtoolbar', Viewer.widgets.InformationToolbar);
