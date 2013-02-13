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

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("Viewer.plugins");

/** api: constructor
 *  .. class:: ExportToKML(config)
 *
 *    Plugin for exporting a selected layer to kml file.
 *    TODO Make this plural - selected layers
 */
Viewer.plugins.ExportToKML = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = vw_exporttokml */
    ptype: "vw_exporttokml",
    exportToKMLText: "Export to KML",
    exportToKMLTooltipText: "Export a layer to kml file",
    exportToKMLMsg: "Generating KML File ...",
    exportToKMLErrorTitle: "Error",
    exportToKMLErrorContent: "Error to export the layer",

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        Viewer.plugins.ExportToKML.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
    },
    
    /** api: method[addActions] */
    addActions: function() {
        var selectedLayer = null;
        var actions = PersistenceGeo.tree.MakeLayerPersistent.superclass.addActions.apply(this, [{
            menuText: this.exportToKMLText,
            iconCls: "gxp-icon-export-kml",
            disabled: true,
            tooltip: this.exportToKMLTooltipText,
            handler: function() {
                var urlToExport = null;
                var paramsToExport = null;
                var urlLocalGeoServer = this.target.sources.local.url.replace("/ows", "");
                if(selectedLayer.url){
                    if(selectedLayer.url.indexOf(urlLocalGeoServer) != -1){
                        urlToExport = urlLocalGeoServer;
                    }
                }
                var contextLayer = null;
                if(selectedLayer.params && selectedLayer.params.LAYERS){
                    if(selectedLayer.params.LAYERS.indexOf(":") != -1){
                        contextLayer = selectedLayer.params.LAYERS.split(":")[0];
                    }
                }
                if(contextLayer != null){
                    urlToExport += "/" + contextLayer + "/wfs"
                }

                paramsToExport = {
                    'SERVICE': 'WFS',
                    'VERSION': selectedLayer.params.VERSION,
                    'REQUEST': 'GetFeature',
                    'TYPENAME': selectedLayer.params.LAYERS,
                    'SRS': Viewer.GEO_PROJECTION,
                    'FORMAT': 'kml',
                    'DOWNLOAD': true,
                    'FILENAME': selectedLayer.params.LAYERS
                };

                Ext.MessageBox.wait(this.exportToKMLMsg);
                
                Ext.Ajax.request({
                    url: urlToExport,
                    params: paramsToExport,
                    method: 'GET',
                    disableCaching: false,
                    success: function(o, r, n){
                        var elemIF = document.createElement("iframe");
                        elemIF.src = this.target.proxy + encodeURIComponent(this.prepareUrlToDownload(r));
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

        this.target.on("layerselectionchange", function(record) {
            if(record && record.data){
                selectedLayer = record.data.layer;
            }
        }, this);
    },

    prepareUrlToDownload: function(data){
        if(data != null){
            var urlToReturn = data.url;
            if(data.params!=null){
                for(p in data.params){
                    urlToReturn += "&" + p + "=" + data.params[p];
                }
            }
        }
        return urlToReturn;
    }
    
});

Ext.preg(Viewer.plugins.ExportToKML.prototype.ptype, Viewer.plugins.ExportToKML);
