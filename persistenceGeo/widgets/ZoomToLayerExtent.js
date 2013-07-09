/*
 * ZoomToLayerExtent.js Copyright (C) 2013 This file is part of PersistenceGeo project
 * 
 * This software is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * As a special exception, if you link this library with other files to
 * produce an executable, this library does not by itself cause the
 * resulting executable to be covered by the GNU General Public License.
 * This exception does not however invalidate any other reasons why the
 * executable file might be covered by the GNU General Public License.
 * 
 * Authors: Alejandro Diaz Torres (mailto:adiaz@emergya.com)
 */

/**
 * @requires plugins/ZoomToExtent.js
 */

/** api: (define)
 *  module = PersistenceGeo.plugins
 *  class = ZoomToLayerExtent
 */
Ext.namespace("PersistenceGeo.plugins");

/** api: constructor
 *  .. class:: ZoomToLayerExtent(config)
 *
 *    Plugin for zooming to the extent of a non-vector layer
 */
PersistenceGeo.plugins.ZoomToLayerExtent = Ext.extend(gxp.plugins.ZoomToLayerExtent, {
    
    /** api: ptype = pgeo_zoomtolayerextent */
    ptype: "pgeo_zoomtolayerextent",
    
    /** api: config[closest]
     *  ``Boolean`` Find the zoom level that most closely fits the specified
     *  extent. Note that this may result in a zoom that does not exactly
     *  contain the entire extent.  Default is false.
     */
    closest: false,

    readedServers: {},
    
    /**
     * private: bboxReadr
     */
    bboxReadr: new Ext.data.XmlReader(
            { record: 'Layer'},
            [
            {name: 'name', mapping: 'Name'}
            ,{name: 'csr', mapping: 'BoundingBox > @CSR'}
            ,{name: 'minx', mapping: 'BoundingBox > @minx'}
            ,{name: 'miny', mapping: 'BoundingBox > @miny'}
            ,{name: 'maxx', mapping: 'BoundingBox > @maxx'}
            ,{name: 'maxy', mapping: 'BoundingBox > @maxy'}
            ]),

    /** api: method[extent]
     */
    extent: function() {
        return this.getMaxLayerExtent(this.selectedRecord.getLayer());
    },

    /**
     * Method: getMaxLayerExtent
     *  
     * get layer extent
     */
    getMaxLayerExtent: function(layer) {
        var dataExtent = layer instanceof OpenLayers.Layer.Vector &&
            layer.getDataExtent();
        if(layer instanceof OpenLayers.Layer.WMS){
            if(!layer.boundCalculated){
                this.getCapabilitiesWMS(layer);
                return null;
            }else{
                return layer.boundCalculated;
            }
        }else{
            return layer.restrictedExtent || dataExtent || layer.maxExtent || this.map.maxExtent;
        }
    },

    /**
     * Method: getCapabilitiesWMS
     * 
     * Shows and return a grid panel with WMS getCapabilites
     * request
     * 
     * Parameters layer - <OpenLayers.Layer.WMS> to obtain
     * capabilities
     */
    getCapabilitiesWMS : function(layer) {
        // Nos traemos el extent del getcapabilities
        this.testLayerInformation(layer.url, app.mapPanel.map, layer);
    },
                    
    /*
     *  private: testLayerInformation
     */
    testLayerInformation: function (url, map, layerToLoad){
        if(!!this.readedServers[url]){
            // only getCapabilities oneTime
            this.handleWMSCapabilitiesResult(this.readedServers[url], layerToLoad, url, true);
        }else{
            var this_instance = this;
            var postUrl = app.proxy + url;
            Ext.Ajax.request({
                url:  postUrl + "&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities",
                params : { SERVICE : 'WMS' , REQUEST : 'GetCapabilities', VERSION: '1.1.1'},
                method: 'GET',
                success: function ( result, request ) { 
                    this.readedServers[url] = result;
                    this.handleWMSCapabilitiesResult(result, layerToLoad, url);
                },
                failure: function ( result, request) {
                    console.error("Error loading getting bbox from "+ url);
                }, 
                scope: this
            });
        }
    },
    
    /**
     * Method: handleWMSCapabilitiesResult
     *  
     * read bbox from capabilities
     */
    handleWMSCapabilitiesResult: function(result, layer, url, cached){
        var format = new OpenLayers.Format.WMSCapabilities();
        var capabilities = format.read(result.responseText);
        var layers = capabilities.capability.layers;
        var nameLayer = layer.params["LAYERS"];
        var layerFound = null;
        for(var i=0; i<layers.length; i++){
            if(nameLayer == layers[i].name){
                layerFound = layers[i];
                break;
            }
        }
        if(layerFound){
            layer.boundCalculated = this.getBounds(layerFound, layer);
            app.mapPanel.map.zoomToExtent(layer.boundCalculated, this.closest);
        }else if(!!cached){
            this.readedServers[url] = null;
            this.getCapabilitiesWMS(layer);
        }
    },

    /**
     * Method: getBounds
     *  
     * read bbox from capabilities
     */
    getBounds: function(layerFound, layer){
        var bounds = null;
        for (var proj in layerFound.bbox){
            try{
                var tmpBbox = layerFound.bbox[proj];
                var originProj =  new OpenLayers.Projection(tmpBbox.srs);
                var mapProj =  new OpenLayers.Projection(layer.projection.projCode);
                bounds = new OpenLayers.Bounds(tmpBbox.bbox[0], tmpBbox.bbox[1], tmpBbox.bbox[2], tmpBbox.bbox[3]).transform(originProj, mapProj);
                break;
            }catch (e){
                console.error(e);
            }
        }
        return bounds;
    }
        
});

Ext.preg(PersistenceGeo.plugins.ZoomToLayerExtent.prototype.ptype, PersistenceGeo.plugins.ZoomToLayerExtent);