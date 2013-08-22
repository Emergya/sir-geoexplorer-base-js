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
   

    mapProjection: null,
    
    /** i18n **/
    titleTool: "Predetermine searches",
    layerTitle: 'Search Result',
    provinceFieldLabel: 'Province',
    provinceFieldPrompt:  'Select a province',
    municipalityFieldLabel: 'Locality',
    municipalityFieldPrompt:  'Select a province first',
    coordinatesSectionLabel: 'Coordinates',
    searchBtnLabel: 'Search',
    adminstrativeLimitsSectionLabel: 'Administrative Limits',

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
            options: {displayInLayerSwitcher:false}
        });

        // This window is never destroyed so adding the layer once
        // in the constructor is enough.
        config.map.addLayer(this.vectorLayer);
        
        

        this.mapProjection = config.map.getProjectionObject();

        Viewer.dialog.DefaultSearches.superclass.constructor.call(this, Ext.apply({
            cls: 'vw_default_searches_window',
            title: this.titleTool,
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
        this.vectorLayer.setVisibility(true);
    },

    onHide: function() {
        this.vectorLayer.removeAllFeatures();
        this.vectorLayer.setVisibility(true);
    },

    onBtnUtmClicked: function(coords) {
        this.vectorLayer.removeAllFeatures();
        this.setCenter(coords.getPoint(this.mapProjection), 14);
    },

    onBtnLonLatClicked: function(coords) {
        this.vectorLayer.removeAllFeatures();
        this.setCenter(coords.getPoint(this.mapProjection), 14);
    },

    onBtnDecimalClicked: function(coords) {
        this.vectorLayer.removeAllFeatures();
        this.setCenter(coords.getPoint(this.mapProjection), 14);
    },

    onCmbProvinceSelected: function(combo, record, index) {
        this.btnMunicipalitySearch.disable();
        this.cmbMunicipality.enable();
        this.cmbMunicipality.clearValue();
        var id = record.get('id');
        this.cmbMunicipality.store.reload({
            params: {
                parentId: id
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
        var styleYellow = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        styleYellow.externalGraphic = '../../img/marker-yellow.png';
        styleYellow.fill = false;
        styleYellow.stroke = false;
        styleYellow.pointRadius = 0;
        styleYellow.graphicWidth = 18;
        styleYellow.graphicHeight = 30;
        styleYellow.fillOpacity = 1;
        styleYellow.graphicXOffset = -30 / 2;
        styleYellow.graphicYOffset = -18 / 2;
        styleYellow.graphicZIndex = 1;
        
        var point = new OpenLayers.Geometry.Point(pCenter.lon, pCenter.lat);
        var pointFeature = new OpenLayers.Feature.Vector(point, null, styleYellow);

        this.vectorLayer.addFeatures([pointFeature]);

    },

    drawPolygon: function(center,  geometry) {


        var style_green = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        style_green.strokeColor = '#FFD700'; 
        style_green.fillColor = '#FFD700';

        var points = [];

        
        var polygonFeature = new OpenLayers.Feature.Vector(geometry, null, style_green);

        this.vectorLayer.addFeatures([polygonFeature]);

        var pCenter = new OpenLayers.LonLat(center.x, center.y);
        this.map.zoomToExtent(geometry.getBounds());
    },

    onBeforeRender: function() {

        this.cmbProvince = new Ext.form.ComboBox({
            name: 'province',
            fieldLabel: this.provinceFieldLabel,
            emptyText: this.provinceFieldPrompt,
            editable: false,
            store: new Ext.data.JsonStore({
                // store configs
                autoDestroy: true,
                proxy: new Ext.data.HttpProxy({
                    url: app.persistenceGeoContext.defaultRestUrl + '/persistenceGeo/getZonesByType?type=P',
                    method: 'GET'
                }),
                storeId: 'store-provinces',
                restFul: false,
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
            fieldLabel: this.municipalityFieldLabel,
            emptyText: this.municipalityFieldPrompt,
            disabled: true,
            editable: false,
            //store: new Viewer.store.Municipalities(),
            store: new Ext.data.JsonStore({
                // store configs
                autoDestroy: true,
                proxy: new Ext.data.HttpProxy({
                    url: app.persistenceGeoContext.defaultRestUrl + '/persistenceGeo/getZonesByParent',
                    method: 'GET'
                }),
                storeId: 'store-municipalities',
                restFul: false,
                // reader configs
                root: 'data',
                idProperty: 'id',
                fields: ['id', 'code', 'name', 'type', 'extension']
            }),
            valueField: 'id',
            displayField: 'name',
            triggerAction: 'all',
            mode: 'local',
            flex: 1,
            anchor: '98%',
            autoLoad: false,
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
                title: this.coordinatesSectionLabel,
                layout: 'fit',
                items: this.searchByCoordinates = new Viewer.widgets.SearchByCoordinates({
                    mapPanel: this.mapPanel,
                    map: this.map,
                    buttonUtmLabel: this.searchBtnLabel,
                    buttonLonLatLabel: this.searchBtnLabel,
                    buttonDecimalLabel: this.searchBtnLabel,
                    listeners: {
                        buttonUtmClicked: this.onBtnUtmClicked.createDelegate(this),
                        buttonLonLatClicked: this.onBtnLonLatClicked.createDelegate(this),
                        buttonDecimalClicked: this.onBtnDecimalClicked.createDelegate(this)
                    }
                })
            }, {
                title: this.adminstrativeLimitsSectionLabel,
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
