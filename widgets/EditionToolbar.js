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

    constructor: function(config) {

        this.tools = [];

        // Workaround for FeatureEditor plugin to work out Composer.js
        this.doAuthorized = window.app.doAuthorized;
        this.isAuthorized = window.app.isAuthorized;

        this.plugins = [{
            ptype: 'gxp_selectfeature',
            actionTarget: 'editiontbar'
        },{
            ptype: 'gxp_addtagtomap',
            id: 'addtagtomap',
            actionTarget: 'editiontbar',
            addTagToMapTooltipText: "Añadir etiqueta al mapa",
            titlePrompt: "Añadir etiqueta",
            promptText: "Inserte el texto de la etiqueta"
        },{
            ptype: 'gxp_createbuffer',
            actionTarget: 'editiontbar'
        }, {
            ptype: 'gxp_newelementfromcoords',
            actionTarget: 'editiontbar'
        }, {
            ptype: 'vw_featureeditor',
            featureManager: 'featuremanager',
            autoLoadFeature: true,
            splitButton: true,
            showButtonText: true,
            //toggleGroup: 'interaction',
            actionTarget: 'editiontbar'
        }];

        Viewer.widgets.EditionToolbar.superclass.constructor.call(this, Ext.apply({
            id: 'editiontbar',
            cls: 'viewer_editiontoolbar'
        }, config));
    },

    /** private: method[getPluginById]*/
    getPlugin: function(id_plugin){
        var plugin = null;
        for(var i=0; i<this.plugins.length; i++){
            if(this.plugins[i].id && this.plugins[i].id == id_plugin){
                plugin = this.plugins[i];
                break;
            }
        }
        return plugin;
    }

});

Ext.reg('viewer_editiontoolbar', Viewer.widgets.EditionToolbar);
