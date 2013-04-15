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
 *  class = ExportToKML
 */

/**
 * api: (extends) plugins/Tool.js
 */
Ext.namespace("Viewer.plugins");

/**
 * api: constructor .. class:: ExportToKML(config)
 * 
 * Plugin for exporting a selected layer to kml file. TODO Make this plural -
 * selected layers
 */
Viewer.plugins.ExportToKML = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = vw_exporttokml */
    ptype: "vw_exporttokml",
    exportToKMLText: "Export to KML",
    exportToKMLTooltipText: "Export a layer to kml file",
    exportToKMLMsg: "Generating KML File ...",
    exportToKMLErrorTitle: "Error",
    exportToKMLErrorContent: "Error to export the layer",
    objectOwner: 'map',
    selectedLayer: null,

    /**
     * private: method[init] :arg target: ``Object`` The object initializing
     * this plugin.
     */
    init: function(target) {
        Viewer.plugins.ExportToKML.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
        
    },
    
    /** api: method[addActions] */
    addActions: function() {
        
        
        var actions = PersistenceGeo.tree.MakeLayerPersistent.superclass.addActions.apply(this, [{
            menuText: this.exportToKMLText,
            iconCls: "gxp-icon-export-kml",
            disabled: true,
            tooltip: this.exportToKMLTooltipText,
            handler: function() {
                var urlToExport = null;
                var paramsToExport = null;
                var urlLocalGeoServer = app.sources.local.url.replace("/ows", "");
                if(this.selectedLayer && this.selectedLayer.url){
                    if(this.selectedLayer.url.indexOf(urlLocalGeoServer) != -1){
                        urlToExport = urlLocalGeoServer;
                    }
                }
                var contextLayer = null;
                if(this.selectedLayer.params && this.selectedLayer.params.LAYERS){
                    if(this.selectedLayer.params.LAYERS.indexOf(":") != -1){
                        contextLayer = this.selectedLayer.params.LAYERS.split(":")[0];
                    }
                }
                if(contextLayer != null){
                    urlToExport += "/" + contextLayer + "/wms/kml";
                }

                paramsToExport = {
                    'layers': this.selectedLayer.params.LAYERS,
                    'DOWNLOAD': true,
                    'FILENAME': this.selectedLayer.params.LAYERS + ".kml"
                };

                Ext.MessageBox.wait(this.exportToKMLMsg);
                
                Ext.Ajax.request({
                    url: urlToExport,
                    params: paramsToExport,
                    method: 'GET',
                    disableCaching: false,
                    success: function(o, r, n){
                        var elemIF = document.createElement("iframe");
                        elemIF.src = app.proxy + encodeURIComponent(this.prepareUrlToDownload(r));
                        elemIF.style.display = "none";
                        document.body.appendChild(elemIF);
                        Ext.MessageBox.updateProgress(1);
                        Ext.MessageBox.hide();
                    },
                    failure: function(o, r, n){
                        Ext.MessageBox.updateProgress(1);
                        Ext.MessageBox.hide();
                        Ext.Msg.show({
                            title: this.exportToKMLErrorTitle,
                            msg: this.exportToKMLErrorContent,
                            buttons: Ext.Msg.OK
                        });
                    },
                    scope: this
                });
            },
            scope: this
        }]);
        
        var owner = this.target;
        if (this.objectOwner === 'toolbar') {
            owner = app;
        }

        owner.on("layerselectionchange", function(record) {
            if(record && record.data){
                this.selectedLayer = record.data.layer;
                
               // if(this.objectOwner === 'toolbar') {
                    this.enableOrDisableAction();
                //}
            }
        }, this);
        
        this.enableOrDisableAction();
    },

    prepareUrlToDownload: function(data){
        var urlToReturn = null;
        if(data != null){
            urlToReturn = data.url;
            if(data.params!=null){
                var first = true;
                for(p in data.params){
                    if (first) {
                        first = false;
                        urlToReturn += "?";
                    } else {
                        urlToReturn += "&";
                    }
                    urlToReturn += p + "=" + data.params[p];
                }
            }
        }
        return urlToReturn;
    },
    isLocalGeoserver: function(url) {
        var urlLocalGeoServer = app.sources.local.url.replace("/ows", "");
        if (url && url.indexOf(urlLocalGeoServer) != -1) {
            return true;
        } else {
            return false;
        }
    },
    enableOrDisableAction: function() {
        if(!this.selectedLayer) {
            this.selectedLayer = Viewer.getSelectedLayer();
        }
        if (this.selectedLayer && this.isLocalGeoserver(this.selectedLayer.url)) {
            Ext.each(this.actions, function(item) {
                item.enable();
                    }, this);
        } else {
            Ext.each(this.actions, function(item) {
               item.disable(); 
            }, this);        
        }
        
    }
    
    
    
});

Ext.preg(Viewer.plugins.ExportToKML.prototype.ptype, Viewer.plugins.ExportToKML);
