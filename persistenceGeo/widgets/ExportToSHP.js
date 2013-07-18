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
 * @requires persistenceGeo/widgets/UrlExporter.js
 */

/** api: (define)
 *  module = PersistenceGeo.widgets
 *  class = ExportToSHP
 */
Ext.namespace("PersistenceGeo.widgets");


/**
 * api: constructor .. class:: ExportToSHP(config)
 *
 * Plugin for exporting a selected layer SHP format
 */
PersistenceGeo.widgets.ExportToSHP = Ext.extend(PersistenceGeo.widgets.UrlExporter, {

    /** api: ptype = pgeo_exporttoshp */
    //ptype: 'pgeo_exporttoshp',

    /** api: ptype = vw_exporttoshp */
    ptype: 'vw_exporttoshp',

    exportText: 'Export to SHP',
    exportTooltipText: 'Export a layer to shape file',
    exportMsg: 'Generating ZIP File ...',
    exportErrorTitle: 'Error',
    exportErrorContent: 'Error to export the layer',
    actionIcon: 'gxp-icon-export-shp',

    /** api: method[getDownloadUrl] 
     *  Generate a SHP download url
     */
    getDownloadUrl: function(){
        var urlLocalGeoServer = app.sources.local.url;
        var requestedLayers = null;

        if (this.selectedLayer.params && this.selectedLayer.params.LAYERS) {
            requestedLayers = this.selectedLayer.params.LAYERS;
        } else {
            console.error('Cannot export layer to SHP. There is no selectedLayer.params ' +
                'or selectedLayers.params.LAYERS is undefined');
            // TODO show messagebox
        }
        
        var params = {
            layers: requestedLayers,
            DOWNLOAD: 'true',
            FILENAME: this.selectedLayer.params.LAYERS.replace(':', '-') + '.shp',
            service: 'WFS',
            version: '1.0.0',
            request: 'GetFeature',
            typename: this.selectedLayer.params.LAYERS,
            outputformat: 'shape-zip'
        };

        var urlParams = Ext.urlEncode(params);

        return urlLocalGeoServer + '?' + urlParams;
    },
    isDownloadableLayer: function() {
        var isDownloadable =  PersistenceGeo.widgets.ExportToSHP.superclass.isDownloadableLayer.apply(this, arguments)
            &&  !this.isRasterLayer(this.selectedLayer.metadata.layerTypeId);
        return isDownloadable;
    }

});

Ext.preg(PersistenceGeo.widgets.ExportToSHP.prototype.ptype, PersistenceGeo.widgets.ExportToSHP);
