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
 * Author: Moisés Arcos Santiago <marcos@emergya.com>
 */

 /**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = MetadataInformation
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");
/** api: constructor
 *  .. class:: MetadataInformation(config)
 *
 *    Provides an action for showing the default search dialog.
 */
gxp.plugins.MetadataInformation = Ext.extend(gxp.plugins.Tool, {
	/** api: ptype = gxp_metadatainformation */
    ptype: "gxp_metadatainformation",
    /** api: config[menuText]
     *  ``String``
     *  Text for layer context menu item (i18n).
     */
    menuText: 'Show metadata of the selected layer',
    /** api: config[tooltip]
     *  ``String``
     *  Text for metadata information tool (i18n).
     */
    tooltip: 'Show metadata of the selected layer',
    
    /** private: property[iconCls]
     */
    iconCls: 'vw-icon-show-metadata',

    windowTitle: 'Layer metadata',
    windowLoadingMsg: 'Loading...',
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.MetadataInformation.superclass.constructor.apply(this, arguments);
    },

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.MetadataInformation.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
    },
    /** api: method[addActions]
     */
    addActions: function() {
        this.selectedLayer = null;
        var action = gxp.plugins.DefaultSearchesAction.superclass.addActions.apply(this, [{
            menuText: this.menuText,
            iconCls: this.iconCls,
            tooltip: this.tooltip,
            disabled: true,
            handler: this.handleAction,
            scope: this
        }]);

        this.launchAction = action[0];

        this.target.on("layerselectionchange", function(record) {
            if(record && record.data){
                this.selectedLayer = record.getLayer();
            }
            this.enableOrDisable(); 
        }, this);

        return action;
    },

    /** api: method[enableOrDisable]
     */
    enableOrDisable: function (){
        var disable = true;
        if(!!this.selectedLayer
            && !!this.selectedLayer.layerID){
            disable = false;
        }
        this.launchAction.setDisabled(disable);
        return disable;
    },
    
    /** api: method[handleAction]
     */
    handleAction: function(action, evt) {
        if(!this.enableOrDisable()){
            this.addOutput();
        }
    },
    
    /** api: method[addOutput]
     */
    addOutput: function() {
        var layerID = this.selectedLayer.layerID;
        var urlToGetMetadataInfo = app.defaultRestUrl + "/../visor-api/mostrarMetadatosDeCapa/";
        var win = new Ext.Window({
            title: this.windowTitle,
            width: 300,
            height: 300,
            layout: 'fit',
            autoScroll: true
        });
        win.show();
        win.load({
            url: urlToGetMetadataInfo + layerID,
            text: this.windowLoadingMsg
        });
    }
});

Ext.preg(gxp.plugins.MetadataInformation.prototype.ptype, gxp.plugins.MetadataInformation);