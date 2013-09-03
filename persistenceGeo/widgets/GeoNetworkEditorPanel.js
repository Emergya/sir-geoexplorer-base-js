/*
 * GeoNetworkEditorPanel.js Copyright (C) 2013 This file is part of PersistenceGeo project
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

/** api: (define)
 *  module = PersistenceGeo.widgets
 *  class = GeoNetworkEditorPanel
 */
Ext.namespace("PersistenceGeo.widgets");

/** api: (define)
 *  module = PersistenceGeo.widgets
 *  class = GeoNetworkEditorPanel
 *  base_link = `GeoNetwork.editor.EditorPanel <http://geonetwork-opensource.org/manuals/2.10.0/eng/widgets/lib/web-client/jst/GeoNetwork/widgets/editor/EditorPanel.html>`_
 */

/** api: constructor 
 *  .. class:: GeoNetworkEditorPanel(config)
 *
 *     Create a GeoNetwork editor panel.
 * 
 *  TODO: Import more data:
 *   * Generate a thumbnail 
 *   * Generate a large_thumbnail 
 *   * Generate a date
 *   * Generate a version
 *   * Generate legal constraints 
 *   * Generate spatial resolution
 *   * Generate author info from pgeo context
 *   * Force spanish everywere
 *   * Remove multi-lengual by default (in template) 
 *   * Improve online info: WFS, WPS, download
 *
 *
 *  Known limitation: only one editor panel could be created in one application
 *
 */
PersistenceGeo.widgets.GeoNetworkEditorPanel = Ext.extend(GeoNetwork.editor.EditorPanel, {

    /** api: ptype = pgeo_gneditor */
    ptype: "pgeo_gneditor",


    /**
     * private: property[controller]
     * ``PersistenceGeo.tree.MakeLayerPublic`` controller of the editor
     */
    controller: null,

    COMMON_DATA:{
        title: 91,
        abstract: 116,
        // Contact info
        contact_name: 137,
        contact_group:139,
        contact_phone: 147,
        contact_mail: 163,
        contact_country: 161,
        // Online info
        online_url: 249
    },

    getFormValue: function(name){
        //TODO: improve this function
        return this.COMMON_DATA[name]? $("#_" + this.COMMON_DATA[name]): null;
    },

    setFormValue: function(name, value){
        var parameter = this.getFormValue(name);
        if(parameter){
            parameter.val(value);
        }

    },

    initWithController: function(controller){
        this.controller = controller;
        var jsonData = controller.getJsonData();
        // overwrite form data
        for(var formParam in jsonData.formData){
            this.setFormValue(formParam, jsonData.formData[formParam]);
        }
        // Handle extent
        this.catalogue.extentMap.mapPanel.map.zoomToExtent(GeoNetwork.map.EXTENT);
        if(jsonData.layerSelected){
            var layer = jsonData.layerSelected.getLayer();
            if(layer.boundCalculated){
                this.catalogue.extentMap.setBbox(layer.boundCalculated);
            }else{
                this.catalogue.extentMap.setBbox(GeoNetwork.map.EXTENT);
            }
            // TODO: Add a compatible layer
            //this.catalogue.extentMap.mapPanel.map.addLayer(layer);
        }
    },

    /** private: method[onMetadataUpdated]
     *  Contructor method.
     */
    onMetadataUpdated: function () {
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.onMetadataUpdated.call(this);
        this.initWithController(this.controller);
    }

});

Ext.preg(PersistenceGeo.widgets.GeoNetworkEditorPanel.prototype.ptype, PersistenceGeo.widgets.GeoNetworkEditorPanel);