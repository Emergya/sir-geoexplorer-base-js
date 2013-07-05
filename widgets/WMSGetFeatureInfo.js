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


Viewer.dialog.WMSGetFeatureInfo = Ext.extend(Ext.Window, {

    ALLOWED_LAYERS: [
            'OpenLayers.Layer.WMS',
            'OpenLayers.Layer.WFS'
    ],

    layersWithInfo: null,
    visibleLayers: null,

    accordion: null,
    cmbLayers: null,
    layersStore: null,
    featuresContainer: null,
    featureInfo: null,
    lastQueriedPoint: null,

    numberFormat: "0.000,00/i",
    linkTemplate: '<a href="{0}" target="_new" title="Click para abrir en nueva pestaña/ventana">{0}</a>',

    constructor: function(config) {

        this.layersWithInfo = {};
        this.visibleLayers = {};

        Viewer.dialog.WMSGetFeatureInfo.superclass.constructor.call(this, Ext.apply({
            cls: 'vw_wmsgetfeatureinfo_window',
            closeAction: 'hide',
            title: 'Información de elementos',
            width: 300,
            height: 400,
            layout: 'fit'
        }, config));

        this.layersStore = new GeoExt.data.LayerStore({
            map: this.map,
            initDir: GeoExt.data.LayerStore.MAP_TO_STORE,
            listeners: {
                remove: function(store, record, index) {
                    var layer = record.get('layer');
                    delete this.visibleLayers[layer.name];
                    delete this.layersWithInfo[layer.name];
                    if (this.cmbLayers && this.cmbLayers.getValue() === layer.name) {
                        if (store.getCount() === 0) {
                            this.cmbLayers.setValue("");
                        } else if (index === 0) {
                            this.cmbLayers.setValue(store.getAt(0).get('layer').name);
                        } else if (index === store.getCount()) {
                            this.cmbLayers.setValue(store.getAt(store.getCount() - 1).get('layer').name);
                        }

                        this.addFeatureInfo(this.layersWithInfo[this.cmbLayers.getValue()]);
                    }

                },
                load: function(store, records, options) {
                    this.filterLayers(store);
                },
                datachanged: function(store) {

                    if (this.visibleLayers[this.cmbLayers.getValue()] === undefined) {
                        var layer = null;
                        var record = this.layersStore.getAt(0);
                        if (record !== undefined) {
                            layer = record.getLayer();
                        } else {
                            layer = {
                                name: ''
                            };
                        }
                        this.cmbLayers.setValue(layer.name);
                        this.addFeatureInfo(this.layersWithInfo[layer.name]);
                    }
                },
                scope: this
            }
        });

        this.on({
            beforerender: this.onBeforeRender,
            beforedestroy: this.onBeforeDestroy,
            show: this._onShow,
            scope: this
        });

        //this.mapPanel.layers.on("update", this.onLayerChanged, this);
        //this.mapPanel.layers.on('add', this, this.onLayerChanged);
        //this.mapPanel.layers.on('remove', this, this.onLayerChanged);
    },

    _onShow: function() {

        var layerController = Viewer.getController('Layers');
        var selectedLayer = layerController.getSelectedLayer();

        if (!selectedLayer || selectedLayer.visibility === false) {
            selectedLayer = this.layersStore.getAt(0);
            if (selectedLayer !== undefined) {
                selectedLayer = selectedLayer.getLayer();
            } else {
                return;
            }
        }

        this.cmbLayers.setValue(selectedLayer.name);
        this.addFeatureInfo(this.layersWithInfo[selectedLayer.name]);
    },

    onHide: function() {
        this.cmbLayers.setValue('');
        this.featuresContainer.removeAll();
    },

    onBeforeDestroy: function() {
        //this.mapPanel.layers.un("update", this.onLayerChanged, this);
        //this.mapPanel.layers.un('add', this, this.onLayerChanged);
        //this.mapPanel.layers.un('remove', this, this.onLayerChanged);
    },

    onLayerChanged: function(store, record, type) {
        this.filterLayers(this.layersStore);
    },

    onCmbLayersSelected: function(widget, record, index) {
        var layer = record.getLayer();
        this.addFeatureInfo(this.layersWithInfo[layer.name]);
    },

    filterLayers: function(store) {
        try {

            store.filterBy(function(record, id) {

                var layer = record.get('layer');
                var include = this.ALLOWED_LAYERS.indexOf(layer.CLASS_NAME) > -1 && layer.visibility;

                if (!include) {
                    delete this.layersWithInfo[layer.name];
                    delete this.visibleLayers[layer.name];
                } else {
                    this.visibleLayers[layer.name] = layer.name;
                }

                return include;

            }.createDelegate(this));

        } catch (e) {
            //console.error(e);
        }
    },

    refreshFeatureInfo: function() {
        if (!this.isVisible()) {
            this.show();
        } else {
            this.addFeatureInfo(this.layersWithInfo[this.cmbLayers.getValue()]);
        }
    },

    addFeatureInfo: function(info) {

        this.featuresContainer.removeAll();

        if (!info) {
            this.addNotAvailableInfo();
            return;
        }

        var features = info.evt.features;
        var fields = info.featureInfo ? info.featureInfo.fields : null;
        var propertyNames = info.featureInfo ? info.featureInfo.propertyNames : null;
        var config = [];

        if (!info.text && features) {

            for (var i = 0, ii = features.length; i < ii; ++i) {
                var feature = features[i];

                // We set default custom renderers so we intercept urls and show'em as links.
                var customRenderers = {};
                var self = this;
                for (var field in feature.attributes) {
                    customRenderers[field] = function(value) {
                        if (Ext.form.VTypes.url(value)) {
                            return (new Ext.Template(self.linkTemplate).apply([value]));
                        } else if (Ext.isNumber(+value)) {
                            return Ext.util.Format.number(+value, self.numberFormat);
                        }
                        return value;
                    }
                }

                var featureIdLbl = feature.fid;
                if (featureIdLbl) {
                    featureIdLbl = "Elemento  " + featureIdLbl.substring(featureIdLbl.lastIndexOf('.') + 1);
                } else {
                    featureIdLbl = info.title;
                }

                config.push(Ext.apply({
                    xtype: 'gxp_editorgrid',
                    readOnly: true,
                    title: featureIdLbl,
                    feature: feature,
                    fields: fields,
                    propertyNames: propertyNames,
                    customRenderers: customRenderers,
                    listeners: {
                        'beforeedit': function(e) {
                            return false;
                        }
                    }
                }, {}));
            }

        } else if (info.text) {

            config.push(Ext.apply({
                title: info.title,
                html: info.text
            }, {}));
        }

        this.featuresContainer.add(config);
        this.featuresContainer.doLayout();
    },

    addNotAvailableInfo: function() {
        this.featuresContainer.add({
            xtype: 'panel',
            layout: 'fit',
            items: {
                xtype: 'label',
                text: 'No hay información disponible para esta capa.'
            }
        });
        this.featuresContainer.doLayout();
    },

    addInfoToLayer: function(layer, info) {

        var queriedPoint = !info ? '' : info.evt.xy.x + ':' + info.evt.xy.y;

        if (queriedPoint != this.lastQueriedPoint) {
            this.lastQueriedPoint = queriedPoint;
            this.layersWithInfo = {};
            this.filterLayers(this.layersStore);
        }

        this.layersWithInfo[layer.name] = info;
    },

    // TODO: Implement the group of attributes in an accordion
    //addTab: function(group) {
    //    var tab = {
    //        xtype: 'panel',
    //        layout: 'fit',
    //        title: group.title,
    //        items: {
    //            xtype: 'panel',
    //            layout: 'fit',
    //            items: [{
    //                xtype: 'panel',
    //                border: false,
    //                autoScroll: true,
    //                items: {html: group.html}
    //            }]
    //        }
    //    };
    //    this.accordion.add(tab);
    //	this.accordion.doLayout();
    //},
    // TODO: Implement the group of attributes in an accordion

    onBeforeRender: function() {

        // TODO: Implement the group of attributes in an accordion
        //this.accordion = new Ext.Panel({
        //    layout: 'accordion',
        //    title: 'Accordion Layout',
        //    defaults: {
        //        bodyStyle: padding + border
        //    },
        //    layoutConfig: {
        //        animate: true
        //    }
        //});
        // TODO: Implement the group of attributes in an accordion

        this.cmbLayers = new Ext.form.ComboBox({
            editable: false,
            triggerAction: 'all',
            lastQuery: '',
            lazyRender: true,
            mode: 'local',
            store: this.layersStore,
            valueField: 'title',
            displayField: 'title',
            anchor: '0',
            fieldLabel: 'Capa',
            listeners: {
                select: this.onCmbLayersSelected,
                scope: this
            }
        });

        var c = {
            xtype: 'panel',
            layout: {
                type: 'vbox',
                align: 'stretch',
                pack: 'start'
            },
            border: false,
            padding: '5px',
            items: [{
                    xtype: 'form',
                    border: true,
                    padding: '15px 15px',
                    labelWidth: 50,
                    labelAlign: 'left',
                    items: [
                        this.cmbLayers
                    ]
                },
                this.featuresContainer = new Ext.Panel({
                    flex: 1,
                    layout: 'accordion',
                    autoScroll: true,
                    items: []
                })
            ],
            buttons: [{
                    text: 'Cerrar',
                    listeners: {
                        click: function() {
                            this.hide();
                        },
                        scope: this
                    }
                }
            ]
        };

        this.add(c);
    }
});