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
	tooltipLengthMeasure: "Length Measure",
	tooltipAreaMeasure: "Area Measure",
	tooltipQueryLayer: "Query Layer",
	tooltipPointInformation: "Point Information",
	tooltipMetadataLayer: "Show metadata information",
	
    constructor: function(config) {

        Ext.apply(this, config);

        this.tools = [];

        this.plugins = [{
            ptype: 'gxp_defaultsearches',
            actionTarget: 'informationtbar',
            tooltip: this.tooltipDefaultSearches,
            toggleGroup: 'globalToggle'
        },{
            ptype: 'gxp_measurelength',
            lengthMenuText: 'Medir longitud',
            lengthTooltip: this.tooltipLengthMeasure,
            actionTarget: 'informationtbar',
            toggleGroup: 'globalToggle'
        },{
            ptype: 'gxp_measurearea',
            areaMenuText: 'Medir área',
            areaTooltip: this.tooltipAreaMeasure,
            actionTarget: 'informationtbar',
            toggleGroup: 'globalToggle'
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
