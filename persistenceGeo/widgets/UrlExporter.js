/**
 * Copyright (C) 2013 This file is part of the project PersistenceGeo project
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
 * Author: Alejandro Díaz Torres <adiaz@emergya.com>
 */

/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = PersistenceGeo.widgets
 *  class = FolderTreePanel
 */
Ext.namespace("PersistenceGeo.widgets");


/**
 * api: constructor .. class:: UrlExporter(config)
 *
 * Abstract plugin for exporting a selected layer in a subclasses format
 */
PersistenceGeo.widgets.UrlExporter = Ext.extend(gxp.plugins.Tool, {

    exportText: 'Export',
    exportTooltipText: 'Export a layer to a file',
    exportMsg: 'Generating File ...',
    exportErrorTitle: 'Error',
    exportErrorContent: 'Error to export the layer',
    objectOwner: 'map',
    selectedLayer: null,
    actionIcon: 'gxp-icon-export-kml',

    /**
     * private: method[init] :arg target: ``Object`` The object initializing
     * this plugin.
     */
    init: function(target) {
        PersistenceGeo.widgets.UrlExporter.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);

    },

    /** api: method[addActions] */
    addActions: function() {


        var actions = PersistenceGeo.widgets.UrlExporter.superclass.addActions.apply(this, [{
                menuText: this.exportText,
                iconCls: this.actionIcon,
                disabled: true,
                tooltip: this.exportTooltipText,
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
        var proxiedUrl = this.getDownloadUrl();
        var requestUrl = app.proxy + encodeURIComponent(proxiedUrl);
        console.debug('ProxiedUrl = ' + proxiedUrl);
        console.debug('RequestUrl = ' + requestUrl);

        try {
            // Cleanup previous download iframes
             Ext.destroy(Ext.get('downloadLayerIframe'));
        }
        catch (e) {}

        Ext.DomHelper.append(document.body, {
            tag: 'iframe',
            id: 'downloadLayerIframe',
            frameBorder: 0,
            width: 0,
            height: 0,
            css: 'display:none;visibility:hidden;height:0;',
            // Fixes #85836 by using the non-proxied url to download the file as the proxy breaks the download of non persisted layers,
            // Returning 0b files..., but working ok in persisted ones. Restore the proxied url if #87063 ever gets fixed.
            src: proxiedUrl
        });
    },

    /** api: method[getDownloadUrl] 
     *  This method must be overwritted in subclasses to generate an url to download the layer.
     */
    getDownloadUrl: function(){
        var urlLocalGeoServer = app.sources.local.url.replace('/ows', '');
        console.error("This method may be overwritted!!");
        return urlLocalGeoServer;
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
        if (data !== null) {
            urlToReturn = data.url;
            if (data.params !== null) {
                var first = true;
                for (var p in data.params) {
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
        var urlLocalGeoServer = app.sources.local.url.replace('/geoserver/ows', '');
        if (url && url.indexOf(urlLocalGeoServer) != -1) {
            return true;
        } else {
            return false;
        }
    },
    isDownloadableLayer: function() {
        return this.isLocalGeoserver(this.selectedLayer.url);
    },
    enableOrDisableAction: function() {
        if (!this.selectedLayer) {
            this.selectedLayer = Viewer.getSelectedLayer();
        }
        if (this.selectedLayer && this.isDownloadableLayer()) {
            Ext.each(this.actions, function(item) {
                item.enable();
            }, this);
        } else {
            Ext.each(this.actions, function(item) {
                item.disable();
            }, this);
        }

    },

    getFileName: function (extension) {
        var fileName = this.selectedLayer.layerTitle;
        if(!fileName) {
            fileName = this.selectedLayer.name;
        }
        
        return  fileName + '.' + extension;
    }


});
