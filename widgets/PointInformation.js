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

Viewer.dialog.PointInformation = Ext.extend(Ext.Window, {
    /** No I18N */
    LAYER_NAME: 'PointInformationLayer',
    layerTitle: 'Resultado de la búsqueda',
    vectorLayer: null,

    descriptionText: 'Please, click the map to view the coordinates of the position clicked.',
    prjGeo: null,
    prjUtm: null,
    lastEvt: null,
    map: null,
    datum: "WGS84",

    utmProjections: {
        "17": new OpenLayers.Projection("EPSG:32717"),
        "18": new OpenLayers.Projection("EPSG:32718"),
        "19": new OpenLayers.Projection("EPSG:32719"),
        "20": new OpenLayers.Projection("EPSG:32720")
    },
    utmProjectionPrefix: "EPSG:327",
    wgs84LatLonProjection: new OpenLayers.Projection("EPSG:4326"),
    dmsCoordinatesFormat: true,

    constructor: function(config) {
        config = config || {};

        this.listeners = {
            beforerender: this.onBeforeRender,
            show: this._onShow,
            scope: this
        };



        if (config.map.getLayersByName(this.LAYER_NAME).length == 1) {
            this.vectorLayer = config.map.getLayersByName(this.LAYER_NAME)[0];
        } else {
            var styleMap = new OpenLayers.StyleMap({
                externalGraphic: '../../img/marker-yellow.png',
                fill: false,
                stroke: false,
                pointRadius: 0,
                graphicWidth: 18,
                graphicHeight: 30,
                fillOpacity: 1,
                graphicXOffset: -10,
                graphicYOffset: -18 - (18/2),
                graphicZIndex: 1
            });


            
            var layerController = Viewer.getController('Layers');
            this.vectorLayer = layerController.create({
                type: 'Vector',
                name: this.LAYER_NAME,
                title: this.layerTitle,
                
                options: {
                    displayInLayerSwitcher: false,
                    styleMap: styleMap
                }
            });

            // This window is never destroyed so adding the layer once
            // in the constructor is enough.
            config.map.addLayer(this.vectorLayer);
        }

        Viewer.dialog.PointInformation.superclass.constructor.call(this, Ext.apply({
            cls: 'vw_point_information_window',
            title: 'Consulta de coordenadas',
            width: 290,
            height: 315,
            closeAction: 'hide',
            layout: 'fit',
            geoProjection: null,
            utmProjection: null
        }, config));

        this.prjGeo = new OpenLayers.Projection(this.geoProjection);
    },

    onMapClicked: function(evt) {
        this.lastEvt = evt;

        var lonLat = this.map.getLonLatFromPixel(evt.xy);

        if (!lonLat) {
            if (evt === null) {
                // map has not yet been properly initialized
                this.reset();
                return;
            }
            lonLat = this.map.getLonLatFromPixel(evt.xy);
        }

        this._clearMarkerLayer();
        var point = new OpenLayers.Geometry.Point(lonLat.lon, lonLat.lat);
        var pointFeature = new OpenLayers.Feature.Vector(point);

        this.vectorLayer.addFeatures([pointFeature]);
        var pGeo = lonLat.clone().transform(this.map.getProjectionObject(), this.prjGeo);
        var utmZone = this.getUtmZone(lonLat);
        var utmProjection = this.getUtmProjection(lonLat, utmZone);
        var pUtm = lonLat.clone().transform(this.map.getProjectionObject(), utmProjection);

        


        this.txtDatum.setValue(this.datum);
        if (this.dmsCoordinatesFormat) {
            var longitude = this.lonLatToDMS(pGeo.lon);
            var latitude = this.lonLatToDMS(pGeo.lat);
            this.txtLat.setValue(latitude[0] + "\u00B0 " + latitude[1] + "' " + latitude[2] + "\"");
            this.txtLon.setValue(longitude[0] + "\u00B0 " + longitude[1] + "' " + longitude[2] + "\"");
        } else {
            this.txtLat.setValue(pGeo.lat.toFixed(Viewer.DEGREES_PRECISION) + "\u00B0");
            this.txtLon.setValue(pGeo.lon.toFixed(Viewer.DEGREES_PRECISION) + "\u00B0");
        }
        this.txtHuso.setValue(utmZone);
        this.txtX.setValue(pUtm.lon.toFixed(Viewer.UTM_PRECISION));
        this.txtY.setValue(pUtm.lat.toFixed(Viewer.UTM_PRECISION));
    },

    reset: function() {
        this.txtDatum.setValue('');
        this.txtLat.setValue('');
        this.txtLon.setValue('');
        this.txtHuso.setValue('');
        this.txtX.setValue('');
        this.txtY.setValue('');
    },

    _onShow: function() {
        this.reset();

          // We change the cursor over the map to indicate selection.
        Ext.select(".olMap").setStyle("cursor", "crosshair");

        this.map.events.on({
            click: this.onMapClicked,
            scope: this
        });
    },

    onHide: function() {
        this.map.events.unregister('click', this, this.onMapClicked);

        // We change the cursor back to default
        Ext.select(".olMap").setStyle("cursor", "default");

        this._clearMarkerLayer();
    },

    onBeforeRender: function() {

        var c = {
            xtype: 'form',
            layout: 'form',
            padding: '20px 10px',           
            items: [{
                xtype: 'label',
                text: this.descriptionText,
                cls: 'toolDescription'

            },
            this.txtDatum = new Ext.form.TextField({
                fieldLabel: 'Datum',
                anchor: '95%',
                value: this.datum,
                readOnly: true
            }),
            this.txtLat = new Ext.form.TextField({
                fieldLabel: 'Latitud',
                anchor: '95%',
                readOnly: true

            }),
            this.txtLon = new Ext.form.TextField({
                fieldLabel: 'Longitud',
                anchor: '95%',
                readOnly: true
            }),
            this.txtHuso = new Ext.form.NumberField({
                fieldLabel: 'Huso',
                anchor: '95%',
                readOnly: true
            }),
            this.txtX = new Ext.form.NumberField({
                fieldLabel: 'X',
                anchor: '95%',
                readOnly: true,
                decimalPrecision: Viewer.UTM_PRECISION
            }),
            this.txtY = new Ext.form.NumberField({
                fieldLabel: 'Y',
                anchor: '95%',
                readOnly: true,
                decimalPrecision: Viewer.UTM_PRECISION
            })]          
        };

        this.add(c);
        this.button = this.addButton({
            text: "Mostrar en decimal",
            minWidth: 140
        },this.toggleCoordinatesFormat, this);
    },
    getUtmProjection: function(mapCoordinates, utmZone) {
        var coord = mapCoordinates.clone();
        coord.transform(this.map.getProjectionObject(),
        this.wgs84LatLonProjection);

        var utmProj = this.utmProjections[utmZone];
        if (!utmProj) {
            if ("" + utmZone) utmProj = new OpenLayers.Projection(this.utmProjectionPrefix + this.lpad(utmZone, 2));
            this.utmProjections[utmZone] = utmProj;
        }
        return utmProj;

    },

    getUtmZone: function(mapCoordinates) {
        var coord = mapCoordinates.clone();
        coord.transform(this.map.getProjectionObject(),
        this.wgs84LatLonProjection);
        return Math.floor((coord.lon + 186) / 6);
    },
    lpad: function(value, padding) {
        var zeroes = "0";

        for (var i = 0; i < padding; i++) {
            zeroes += "0";
        }

        return (zeroes + value).slice(padding * -1);
    },
    toggleCoordinatesFormat: function() {
        this.dmsCoordinatesFormat = !this.dmsCoordinatesFormat;
        if (this.dmsCoordinatesFormat) {
            this.button.setText("Mostrar en Decimal");
        } else {
            this.button.setText("Mostrar en GG\u00B0 MM' SS\"");
        }
        this.onMapClicked(this.lastEvt);
    },

    lonLatToDMS: function(coord) {
        var d = parseInt(coord, 10);
        var md = Math.abs(coord - d) * 60;
        var m = parseInt(md, 10);
        var sd = (md - m) * 60;
        return [d, m, sd.toFixed(3)];
    },

    _clearMarkerLayer: function() {
        this.vectorLayer.removeAllFeatures();
    }

});

Ext.reg('viewer_pointInformation', Viewer.dialog.PointInformation);