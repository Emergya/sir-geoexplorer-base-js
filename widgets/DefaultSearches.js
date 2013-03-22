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

Viewer.dialog.DefaultSearches = Ext.extend(Ext.Window, {

    LAYER_NAME: 'DefaultSearchLayer',
    layerTitle: 'Resultado de la búsqueda',

    mapProjection: null,

    constructor: function(config) {

        this.listeners = {
            show: this._onShow,
            hide: this.onHide,
            beforerender: this.onBeforeRender,
            scope: this
        };

        var layerController = Viewer.getController('Layers');
        this.vectorLayer = layerController.create({
            type: 'Vector',
            name: this.LAYER_NAME,
            title: this.layerTitle,
            options: {}
        });

        // This window is never destroyed so adding the layer once
        // in the constructor is enough.
        config.map.addLayer(this.vectorLayer);
        
        

        this.mapProjection = config.map.getProjectionObject();

        Viewer.dialog.DefaultSearches.superclass.constructor.call(this, Ext.apply({
            cls: 'vw_default_searches_window',
            title: 'Búsquedas predeterminadas',
            width: 380,
            height: 260,
            closeAction: 'hide',
            layout: 'fit'
        }, config));
    },

    _onShow: function() {
        this.searchByCoordinates.clear();
        this.cmbProvince.setValue('');
        this.cmbMunicipality.setValue('');
    },

    onHide: function() {
        this.vectorLayer.removeAllFeatures();
    },

    onBtnUtmClicked: function(coords) {
        this.vectorLayer.removeAllFeatures();
        this.setCenter(coords.getPoint(this.mapProjection));
    },

    onBtnLonLatClicked: function(coords) {
        this.vectorLayer.removeAllFeatures();
        this.setCenter(coords.getPoint(this.mapProjection));
    },

    onBtnDecimalClicked: function(coords) {
        this.vectorLayer.removeAllFeatures();
        this.setCenter(coords.getPoint(this.mapProjection));
    },

    onCmbProvinceSelected: function(combo, record, index) {
        this.btnMunicipalitySearch.disable();
        this.cmbMunicipality.enable();
        this.cmbMunicipality.clearValue();
        this.cmbMunicipality.store.load({
            params: {
                parentId: record.get('id')
            }
        });
    },

    onCmbMunicipalitySelected: function(combo, record, index) {
        this.btnMunicipalitySearch.enable();
    },

    onBtnMunicipalitySearchClicked: function() {


        var record = this.cmbMunicipality.store.getById(this.cmbMunicipality.getValue());
        var geometryString = record.get('extension');
        var format = new OpenLayers.Format.GeoJSON();
        var featureCollection = format.read(geometryString);
        var reprojected = featureCollection[0].geometry.clone().transform("EPSG:32719", this.map.getProjectionObject());
        var center = reprojected.getCentroid();
        

        this.vectorLayer.removeAllFeatures();
        this.drawPolygon(center, reprojected);
    },

    setCenter: function(pCenter, zoom) {
        this.map.setCenter(pCenter, zoom);
        this.drawCenter(pCenter);
    },

    drawCenter: function(pCenter) {

        var style_blue = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        style_blue.strokeColor = 'blue'; 
        style_blue.fillColor = 'blue';
        var point = new OpenLayers.Geometry.Point(pCenter.lon, pCenter.lat);
        var pointFeature = new OpenLayers.Feature.Vector(point, null, style_blue);

        this.vectorLayer.addFeatures([pointFeature]);

        //var style = { 
        //    strokeColor: '#000000',
        //    strokeOpacity: 0.8,
        //    strokeWidth: 1
        //};

        //var hPoints = [
        //    new OpenLayers.Geometry.Point(pCenter.lon - 10, pCenter.lat),
        //    new OpenLayers.Geometry.Point(pCenter.lon + 10, pCenter.lat)
        //];

        //var vPoints = [
        //    new OpenLayers.Geometry.Point(pCenter.lon, pCenter.lat - 10),
        //    new OpenLayers.Geometry.Point(pCenter.lon, pCenter.lat + 10)
        //];

        //var hLine = new OpenLayers.Geometry.LineString(hPoints);
        //var vLine = new OpenLayers.Geometry.LineString(vPoints);

        //var hLineFeature = new OpenLayers.Feature.Vector(hLine, null, style);
        //var vLineFeature = new OpenLayers.Feature.Vector(vLine, null, style);

        //this.vectorLayer.addFeatures([hLineFeature, vLineFeature]);
    },

    drawPolygon: function(center,  geometry) {


        var style_green = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        style_green.strokeColor = 'green'; 
        style_green.fillColor = 'green';

        var points = [];

        
        var polygonFeature = new OpenLayers.Feature.Vector(geometry, null, style_green);

        this.vectorLayer.addFeatures([polygonFeature]);

        var pCenter = new OpenLayers.LonLat(center.x, center.y);
        this.map.zoomToExtent(geometry.getBounds());
    },

    onBeforeRender: function() {

        this.cmbProvince = new Ext.form.ComboBox({
            name: 'province',
            fieldLabel: 'Provincia',
            emptyText: 'Seleccione una provincia',
            editable: false,
            store: new Ext.data.JsonStore({
                // store configs
                autoDestroy: true,
                proxy: new Ext.data.HttpProxy({
                    url: app.persistenceGeoContext.defaultRestUrl + '/persistenceGeo/getZonesByType?type=P',
                    method: 'GET'
                }),
                storeId: 'store-provinces',
                restFul: true,
                // reader configs
                root: 'data',
                idProperty: 'id',
                fields: ['id', 'code', 'name', 'type', 'extension']
            }),
            valueField: 'id',
            displayField: 'name',
            triggerAction: 'all',
            flex: 1,
            anchor: '98%',
            listeners: {
                select: this.onCmbProvinceSelected,
                scope: this
            }
        });
        this.cmbMunicipality = new Ext.form.ComboBox({
            name: 'municipality',
            fieldLabel: 'Municipalidades',
            emptyText: 'Seleccione una provincia primero',
            disabled: true,
            editable: false,
            store: new Viewer.store.Municipalities(),
            store: new Ext.data.JsonStore({
                // store configs
                autoDestroy: true,
                proxy: new Ext.data.HttpProxy({
                    url: app.persistenceGeoContext.defaultRestUrl + '/persistenceGeo/getZonesByParent',
                    method: 'GET'
                }),
                storeId: 'store-municipalities',
                restFul: true,
                // reader configs
                root: 'data',
                idProperty: 'id',
                fields: ['id', 'code', 'name', 'type', 'extension']
            }),
            valueField: 'id',
            displayField: 'name',
            triggerAction: 'all',
            flex: 1,
            anchor: '98%',
            listeners: {
                select: this.onCmbMunicipalitySelected,
                scope: this
            }
        });
        this.btnMunicipalitySearch = new Ext.Button({
            text: 'Buscar',
            disabled: true,
            listeners: {
                click: this.onBtnMunicipalitySearchClicked,
                scope: this
            }
        });

        var padding = 'padding: 10px 16px;';
        var border = 'border: 0px solid transparent;';

        var c = {
            xtype: 'panel',
            layout: {
                type: 'accordion',
                animate: true
            },
            items: [{
                title: 'Coordenadas',
                layout: 'fit',
                items: this.searchByCoordinates = new Viewer.widgets.SearchByCoordinates({
                    mapPanel: this.mapPanel,
                    map: this.map,
                    buttonUtmLabel: 'Buscar',
                    buttonLonLatLabel: 'Buscar',
                    buttonDecimalLabel: 'Buscar',
                    listeners: {
                        buttonUtmClicked: this.onBtnUtmClicked.createDelegate(this),
                        buttonLonLatClicked: this.onBtnLonLatClicked.createDelegate(this),
                        buttonDecimalClicked: this.onBtnDecimalClicked.createDelegate(this)
                    }
                })
            }, {
                title: 'Límites Administrativos',
                layout: 'fit',
                defaults: {
                    bodyStyle: padding + border
                },
                items: {
                    xtype: 'form',
                    defaults: {
                        labelWidth: 15
                    },
                    items: [
                        this.cmbProvince,
                        this.cmbMunicipality
                    ],
                    buttons: [
                        this.btnMunicipalitySearch
                    ]
                }
            }]
        };

        this.add(c);
    }
});
