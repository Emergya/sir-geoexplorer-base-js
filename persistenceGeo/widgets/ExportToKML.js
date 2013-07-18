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
PersistenceGeo.widgets.ExportToKML = Ext.extend(PersistenceGeo.widgets.UrlExporter, {

    /** api: ptype = pgeo_exporttoshp */
    //ptype: 'pgeo_exporttoshp',

    /** api: ptype = vw_exporttokml */
    ptype: 'vw_exporttokml',

    exportText: 'Export to KML',
    exportTooltipText: 'Export a layer to kml file',
    exportMsg: 'Generating KML File ...',
    exportErrorContent: 'Error to export the layer',
    actionIcon: 'gxp-icon-export-kml',

    /** api: method[getDownloadUrl] 
     *  Generate a KML download url
     */
    getDownloadUrl: function(){
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

        return urlLocalGeoServer + '/wms/kml?' + urlParams;
    }

});

Ext.preg(PersistenceGeo.widgets.ExportToKML.prototype.ptype, PersistenceGeo.widgets.ExportToKML);
