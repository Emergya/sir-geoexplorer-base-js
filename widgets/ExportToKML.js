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
Ext.namespace('Viewer.plugins');

/**
 * api: constructor .. class:: ExportToKML(config)
 *
 * Plugin for exporting a selected layer to kml file. TODO Make this plural -
 * selected layers
 */
Viewer.plugins.ExportToKML = Ext.extend(gxp.plugins.Tool, {

    /** api: ptype = vw_exporttokml */
    ptype: 'vw_exporttokml',
    exportToKMLText: 'Export to KML',
    exportToKMLTooltipText: 'Export a layer to kml file',
    exportToKMLMsg: 'Generating KML File ...',
    exportToKMLErrorTitle: 'Error',
    exportToKMLErrorContent: 'Error to export the layer',
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
                iconCls: 'gxp-icon-export-kml',
                disabled: true,
                tooltip: this.exportToKMLTooltipText,
                handler: this.downloadActionHandler,
                scope: this
            }
        ]);

        var owner = this.target;
        if (this.objectOwner === 'toolbar') {
            owner = app;
        }

        owner.on('layerselectionchange', function(record) {
            if (record && record.data) {
                this.selectedLayer = record.data.layer;

                // if(this.objectOwner === 'toolbar') {
                this.enableOrDisableAction();
                //}
            }
        }, this);

        this.enableOrDisableAction();
    },

    downloadActionHandler: function() {
        var urlLocalGeoServer = app.sources.local.url.replace('/ows', '');
        var requestedLayers = null;
        var requestedBbox = '-180.0,-90.0,180.0,90.0';



        if (this.selectedLayer.params && this.selectedLayer.params.LAYERS) {
            requestedLayers = this.selectedLayer.params.LAYERS;
        } else {
            console.error('Cannot export layer to KML. There is no selectedLayer.params ' +
                'or selectedLayers.params.LAYERS is undefined');
            // TODO show messagebox
        }
        
        var params = {
            layers: requestedLayers,
            DOWNLOAD: 'true',
            FILENAME: this.selectedLayer.params.LAYERS.replace(':', '-') + '.kml'
        };

        if (!this.isRasterLayer(this.selectedLayer.metadata.layerTypeId)) {
           params.bbox = requestedBbox;
           params.mode = 'download';
        }



        var urlParams = Ext.urlEncode(params);

        console.debug(urlParams);

        var proxiedUrl = urlLocalGeoServer + '/wms/kml?' + urlParams;
        var requestUrl = app.proxy + encodeURIComponent(proxiedUrl);
        console.debug('ProxiedUrl = ' + proxiedUrl);
        console.debug('RequestUrl = ' + requestUrl);

        try {
            // Cleanup previous download iframes
             Ext.destroy(Ext.get('downloadKmlIframe'));
        }
        catch (e) {}

        Ext.DomHelper.append(document.body, {
            tag: 'iframe',
            id: 'downloadKmlIframe',
            frameBorder: 0,
            width: 0,
            height: 0,
            css: 'display:none;visibility:hidden;height:0;',
            src: requestUrl
        });
    },

    isRasterLayer: function(layerType) {
        /*
         id |    name     |   tipo    
        ----+-------------+-----------
          1 | WMS         | Raster
          2 | WFS         | Raster
          3 | KML         | Raster
          4 | WMS         | Vectorial
          5 | WFS         | Vectorial
          6 | KML         | Vectorial
          7 | postgis     | Vectorial
          8 | geotiff     | Raster
          9 | imagemosaic | Raster
         10 | imageworld  | Raster
        */
        return layerType == 1 || layerType == 2 || layerType == 3 ||
            layerType == 8 || layerType == 9 || layerType == 10;
    },

    prepareUrlToDownload: function(data) {
        var urlToReturn = null;
        if (data != null) {
            urlToReturn = data.url;
            if (data.params != null) {
                var first = true;
                for (p in data.params) {
                    if (first) {
                        first = false;
                        urlToReturn += '?';
                    } else {
                        urlToReturn += '&';
                    }
                    urlToReturn += p + '=' + data.params[p];
                }
            }
        }
        return urlToReturn;
    },
    isLocalGeoserver: function(url) {
        var urlLocalGeoServer = app.sources.local.url.replace('/ows', '');
        if (url && url.indexOf(urlLocalGeoServer) != -1) {
            return true;
        } else {
            return false;
        }
    },
    enableOrDisableAction: function() {
        if (!this.selectedLayer) {
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
