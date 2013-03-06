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

Viewer.dialog.NewBuffer = Ext.extend(Ext.Window, {

    UNIT_METERS: 'Meter',
    UNIT_KILOMETERS: 'Kilometer',
    UNIT_MILES: 'Mile',

    LAYER_NAME: 'Buffers',

    layerController: null,
    vectorLayer: null,
    selectedFeatures: [],

    constructor: function(config) {

        this.listeners = {
            beforerender: this.onBeforeRender,
            show: this._onShow,
            scope: this
        };

        Viewer.dialog.NewBuffer.superclass.constructor.call(this, Ext.apply({
            cls: 'vw_new_buffer_window',
            title: 'Crear buffer',
            width: 400,
            height: 160,
            closeAction: 'hide',
            layout: 'fit'
        }, config));

        this.layerController = Viewer.getController('Layers');
        this.selectedFeatures = this.layerController.getSelectedFeatures();

        this.vectorLayer = this.layerController.create({
            type: 'Vector',
            name: this.LAYER_NAME,
            options: {}
        });

        this.map.addLayer(this.vectorLayer);
    },

    onShow: function() {

        if (!this.selectedFeatures) {
            this.selectedFeatures = [];
        }

        if (this.selectedFeatures.length == 0) {
            this.btnCreate.disable();
        }

        this.txtDistance.setValue(0);

        this.layerController.on({
            featureSelected: this.onFeatureSelected,
            featureUnselected: this.onFeatureUnselected,
            scope: this
        });
    },

    onHide: function() {
        this.layerController.un('featureSelected', this.onFeatureSelected, this);
        this.layerController.un('featureUnselected', this.onFeatureUnselected, this);
    },

    onFeatureSelected: function(feature) {
        this.selectedFeatures.push(feature);
        this.btnCreate.enable();
    },

    onFeatureUnselected: function(feature) {
        var aux = [];
        for (var i=0, l=this.selectedFeatures.length; i<l; i++) {
            var f = this.selectedFeatures[i];
            if (feature !== f) {
                aux.push(f);
            }
        }
        this.selectedFeatures = aux;
        if (this.selectedFeatures.length == 0) {
            this.btnCreate.disable();
        }
    },

    onCreateButtonClicked: function() {
        if (this.selectedFeatures.length > 0 && this.txtDistance.getValue() > 0) {
            this.vectorLayer.removeAllFeatures();
            this.createBuffer();
        }
    },

    onCancelButtonClicked: function() {
        this.hide();
    },

    createBuffer: function() {

        var buffers = [];
        var radius = this.txtDistance.getValue();

        for (var i=0, l=this.selectedFeatures.length; i<l; i++) {
            var buffer = this.layerController.createBufferForFeature(
                this.selectedFeatures[i],
                radius,
                this.radioGroup.getValue().getGroupValue()
            );
            buffers.push(new OpenLayers.Feature.Vector(
                buffer,
                null,
                {
                    fillColor: 'blue',
                    opacity: 0.6
                }
            ));
        }
        this.vectorLayer.addFeatures(buffers);
    },

    onBeforeRender: function() {

        var padding = 'padding: 10px 16px;';
        var border = 'border: 0px solid transparent;'

        var c = {
            xtype: 'form',
            layout: 'form',
            padding: '20px 10px',
            items: [
                this.txtDistance = new Ext.form.NumberField({
                    fieldLabel: 'Distancia',
                    anchor: '95%'
                }),
                this.radioGroup = new Ext.form.RadioGroup({
                    items: [
                        new Ext.form.Radio({ boxLabel: 'Metros', name: 'units', inputValue: this.UNIT_METERS, checked: true }),
                        new Ext.form.Radio({ boxLabel: 'Kilómetros', name: 'units', inputValue: this.UNIT_KILOMETERS }),
                        new Ext.form.Radio({ boxLabel: 'Millas', name: 'units', inputValue: this.UNIT_MILES })
                    ]
                })
            ],
            buttons: [
                this.btnCreate = new Ext.Button({
                    text: 'Crear',
                    listeners: {
                        click: this.onCreateButtonClicked,
                        scope: this
                    }
                }),
                this.btnCancel = new Ext.Button({
                    text: 'Cancelar',
                    listeners: {
                        click: this.onCancelButtonClicked,
                        scope: this
                    }
                })
            ]
        };

        this.add(c);
    }
});
