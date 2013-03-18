/**
 * Copyright (C) 2013
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
 *
 * @require OpenLayers/WPSClient.js
 */

Viewer.dialog.StoredSearchWindow = Ext.extend(Ext.Window, {

    ptype: 'viewer_storedSearchWindow',

    controller: null,

    formFields: null,
    
    /** api: config[closest]
     *  ``Boolean`` Find the zoom level that most closely fits the specified
     *  extent. Note that this may result in a zoom that does not exactly
     *  contain the entire extent.  Default is false.
     */
    closest: false,
    
    /** api: config[autoExpand]
     *  ``String`` Reference to feature grid table to expand on show
     */
    autoExpand: "table",

    constructor: function(config) {

        var constructor = Viewer.controller[config.controller];
        this.controller = new constructor(config);

        // Important!
        delete config.controller;

        this.controller.on({
            load: this.onQueryLoaded,
            loadError: this.onQueryLoadError,
            scope: this
        });

        this.listeners = {
            beforerender: this.onBeforeRender,
            afterrender: this.onAfterRender,
            scope: this
        };

        Viewer.dialog.StoredSearchWindow.superclass.constructor.call(this, Ext.apply({
            cls: 'vw_storedsearch_window',
            title: this.controller.title,
            width: 800,
            height: 320,
            closeAction: 'hide',
            layout: 'fit',
        }, config));
    },

    onShow: function() {

        this.manager = this.target.target.tools[this.featureManager];

        this.grid = new gxp.grid.FeatureGrid({
            map: this.map,
            ignoreFields: ['the_geom'],
            height: 200
        });

        var options = {
            url : this.controller.wfsServiceUrl, 
            maxFeatures: 500,
            featureType: this.controller.featureType,
            projection: this.target.target.mapPanel.map.projection
        };

        var _strategies = [
                new OpenLayers.Strategy.BBOX(),
                new OpenLayers.Strategy.Refresh({
                    interval : 5000
                }) ];

        this.controller.layer = new OpenLayers.Layer.Vector(
            this.controller.title,
            {
                'visibility' : true,
                'strategies' : _strategies,
                'protocol' : new OpenLayers.Protocol.WFS(options)
        });


        this.target.target.mapPanel.map.addLayer(this.controller.layer);
        // copy to record type
        var  recordType = GeoExt.data.LayerRecord.create([{name: "name", type: "string"}]);
        this.recordLayer = new recordType({
            name: this.controller.layer.name,
            source: this.target.target.sources.local,
            layer: this.controller.layer
        }, this.controller.layer);
        this.target.target.selectLayer(this.recordLayer);
        this.controller.onShow();

        this.onSearchButtonClicked();
    },

    onHide: function() {
        if(!!this.controller.layer){
            this.target.target.mapPanel.map.removeLayer(this.controller.layer);
        }
        this.showGrid(false);
        this.controller.onHide();
    },

    onFilterChanged: function(widget, store, value) {
        try {
            this.controller.queryDefIndex[widget.name].comparison = widget.getValue();
        } catch(e) {}
    },

    onValueChanged: function(widget, store, value) {
        try {
            this.controller.queryDefIndex[widget.name].value = widget.getValue();
        } catch(e) {}
    },

    onSearchButtonClicked: function(widget, evt) {

        for (var i=0, l=this.controller.queryDef.length; i<l; i++) {
            var item = this.controller.queryDef[i];
            var field = this.formFields[item.property];
            item.value = field.getValue();
        }

        this.loadMask || (this.loadMask = new Ext.LoadMask(
            this.getId(),
            { msg: 'Buscando...' }
        ));
        this.loadMask.show();

        //TODO: HANDLE here this.controller.doRequest();

        var ogcFilter = new Viewer.plugins.XmlQueryAdapter()
            .parse(this.controller.queryDef);

        this.controller.layer.filter = ogcFilter;
        this.controller.layer.refresh({force: true});

        this.manager.loadFeatures(ogcFilter, function (){  

            this.grid.setStore(this.manager.featureStore);

            this.btnZoomToResult.setDisabled(false);
            this.btnPrint.setDisabled(false);

            this.showGrid(true);

            this.loadMask.hide();
        }, this);
    },

    showGrid: function(show){
        var expandContainer = Ext.getCmp(this.autoExpand);
        if(show){
            expandContainer.expand();
            if (expandContainer.ownerCt && expandContainer.ownerCt instanceof Ext.Panel) {
                expandContainer.ownerCt.expand();
            }
        }else{
            expandContainer.collapse();
            if (expandContainer.ownerCt && expandContainer.ownerCt instanceof Ext.Panel) {
                expandContainer.ownerCt.collapse();
            }
        }
        
    },

    onQueryLoaded: function(features) {
        this.loadMask.hide();
        console.info('load', features);

        //var store = new gxp.data.WFSFeatureStore({
        //    url: this.controller.wfsServiceUrl,
        //    featureType: this.controller.featureType,
        //    fields: [
        //        'NOMBRE'
        //    ],
        //    autoLoad: true
        //});

        //store.setOgcFilter(new Viewer.plugins.XmlQueryAdapter()
        //        .parse(this.controller.queryDef));
        //this.grid.setStore(store);
    },

    onQueryLoadError: function(response) {
        this.loadMask.hide();
        Ext.Msg.show({
            title: 'Error en la petición',
            msg: response.message,
            buttons: Ext.Msg.OK,
            icon: Ext.MessageBox.ERROR
        });
        console.warn('loadError', response);
    },

    replaceAll: function (origin, match, replacement){
        if (origin.indexOf(match)> -1){
            // recursive case
            return this.replaceAll(origin.replace(match, replacement), match, replacement);
        }else{
            // base case
            return origin;
        }

    },

    onBeforeRender: function() {

        var components = new Viewer.plugins.FormQueryAdapter()
            .parse(this.controller.formDef);

        var formContainer = new Ext.FormPanel({
            labelWidth: 120,
            buttons: [
                this.btnZoomToResult = new Ext.Button({
                    text: 'Centrar',
                    disabled: true,
                    listeners: {
                        click: function(){
                            this.zoomToLayerExtent();
                        },
                        scope: this
                    }
                }),
                this.btnPrint = new Ext.Button({
                    text: 'Imprimir',
                    disabled: true,
                    listeners: {
                        click: function(){
                            var header = Ext.getCmp('viewer-header');
                            var footer = Ext.getCmp('viewer-footer');
                            var headerHTML = '<div id ="viewer-header">' + header.getEl().dom.innerHTML + '</div>';
                            var footerHTML = '<div id ="viewer-footer">' + footer.getEl().dom.innerHTML + '</div>';
                            headerHTML = this.replaceAll(headerHTML, '../theme', document.URL + 'tmpReplace');
                            headerHTML = this.replaceAll(headerHTML, document.URL + 'tmpReplace', document.URL + '../theme');
                            footerHTML = this.replaceAll(footerHTML, '../theme', document.URL + 'tmpReplace');
                            footerHTML = this.replaceAll(footerHTML, document.URL + 'tmpReplace', document.URL + '../theme');
                            // Ext.ux.GridPrinter.stylesheetPath = document.URL + '../theme/ux/ohiggins.css';
                            Ext.ux.GridPrinter.stylesheetPath = document.URL + '../theme/ux/ext.ux/print.css';
                            Ext.ux.GridPrinter.rootPath = document.URL + '..';
                            Ext.ux.GridPrinter.print(this.grid, this.title, headerHTML, footerHTML);
                        },
                        scope: this
                    }   
                }),
                this.btnClear = new Ext.Button({
                    text: 'Limpiar',
                    listeners: {
                        click: function(){
                            this.controller.clearForm();
                            this.onSearchButtonClicked();
                        },
                        scope: this
                    }   
                }),
                this.btnSearch = new Ext.Button({
                    text: 'Buscar',
                    listeners: {
                        click: this.onSearchButtonClicked,
                        scope: this
                    }   
                })
            ]
        });

        for (var i=0, l=components.length; i<l; i++) {

            var condition = components[i];

            if (condition.filters) {

                formContainer.add({
                    xtype: 'compositefield',
                    anchor: '-20',
                    items: [
                        Ext.apply(condition.filters, {
                            listeners: {
                                select: this._getFieldHandler(condition['onChange'], this.onFilterChanged.createDelegate(this)),
                                scope: this
                            }
                        }),
                        Ext.apply(condition.values, {
                            listeners: {
                                select: this._getFieldHandler(condition['onChange'], this.onValueChanged.createDelegate(this)),
                                keypress: this._getFieldHandler(condition['onChange'], this.onValueChanged.createDelegate(this)),
                                scope: this
                            }
                        })
                    ]
                });

            } else if (condition.values) {

                formContainer.add(Ext.apply(condition.values, {
                    listeners: {
                        select: this._getFieldHandler(condition['onChange'], this.onValueChanged.createDelegate(this)),
                        keypress: this._getFieldHandler(condition['onChange'], this.onValueChanged.createDelegate(this)),
                        scope: this
                    }
                }));
            }
        }     

        this.add(formContainer);
    },

    _getFieldHandler: function(handler1, handler2) {
        return typeof(handler1) == 'function'
            ? function(widget, store, value) {
                    handler2(widget, store, value);
                    handler1(widget, store, value, this.formFields);
                }.createDelegate(this)
            : handler2;
    },

    onAfterRender: function() {
        this.formFields = {};
        var formFields = Viewer.getByClass('vw-stored-search-field');
        for (var i=0,l=formFields.items.length; i<l; i++) {
            var field = formFields.items[i];
            this.formFields[field.name] = field;
        }
        this.controller.formFields = this.formFields;
        this.controller.onAfterRender();
    },

    /** api: method[zoomToLayerExtent]
     * 
     * Zoom to layer extent
     */
    zoomToLayerExtent: function() {
        var map = this.target.target.mapPanel.map;
        var layer = this.controller.layer;
        if (OpenLayers.Layer.Vector) {
            dataExtent = layer instanceof OpenLayers.Layer.Vector &&
                layer.getDataExtent();
        }
        var extent =  layer.restrictedExtent || dataExtent || layer.maxExtent || map.maxExtent;
        if (extent) {
            // respect map properties
            var restricted = map.restrictedExtent || map.maxExtent;
            if (restricted) {
                extent = new OpenLayers.Bounds(
                    Math.max(extent.left, restricted.left),
                    Math.max(extent.bottom, restricted.bottom),
                    Math.min(extent.right, restricted.right),
                    Math.min(extent.top, restricted.top)
                );
            }
            map.zoomToExtent(extent, this.closest);
        }
    }
});

Ext.reg('viewer_storedSearchWindow', Viewer.dialog.StoredSearchWindow);
