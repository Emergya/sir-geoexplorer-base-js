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

    prjGeo: null,
    prjUtm: null,

    constructor: function(config) {

        this.listeners = {
            beforerender: this.onBeforeRender,
            scope: this
        };

        Viewer.dialog.PointInformation.superclass.constructor.call(this, Ext.apply({
            cls: 'vw_point_information_window',
            title: 'Consulta de coordenadas',
            width: 290,
            height: 200,
            closeAction: 'hide',
            layout: 'fit',
            datum: 'WGS84',
            huso: 19,
            geoProjection: null,
            utmProjection: null
        }, config));

        this.prjGeo = new OpenLayers.Projection(this.geoProjection);
        this.prjUtm = new OpenLayers.Projection(this.utmProjection);
    },

    onMapClicked: function(evt) {

        var lonLat = this.map.getLonLatFromPixel(evt.xy);

        if (!lonLat) {
            if (evt == null) {
                // map has not yet been properly initialized
                this.reset();
                return;
            }
            lonLat = this.map.getLonLatFromPixel(evt.xy);
        }

        var pGeo = lonLat.clone().transform(this.map.getProjectionObject(), this.prjGeo);
        var pUtm = lonLat.clone().transform(this.map.getProjectionObject(), this.prjUtm);

        var digits = parseInt(this.numDigits);

        this.txtDatum.setValue(this.datum);
        this.txtLat.setValue(pGeo.lat.toFixed(Viewer.DEGREES_PRECISION));
        this.txtLon.setValue(pGeo.lon.toFixed(Viewer.DEGREES_PRECISION));
        this.txtHuso.setValue(this.huso);
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

    onShow: function() {
        this.reset();
        this.map.events.on({
            click: this.onMapClicked,
            scope: this
        });
    },

    onHide: function() {
        this.map.events.unregister('click', this, this.onMapClicked);
    },

    onBeforeRender: function() {

        var c = {
            xtype: 'form',
            layout: 'form',
            padding: '20px 10px',
            items: [
                this.txtDatum = new Ext.form.TextField({
                    fieldLabel: 'Datum',
                    anchor: '95%',
                    readOnly: true,
                    hidden: true
                }),
                this.txtLat = new Ext.form.NumberField({
                    fieldLabel: 'Latitud',
                    anchor: '95%',
                    readOnly: true,
                    decimalPrecision: Viewer.DEGREES_PRECISION
                }),
                this.txtLon = new Ext.form.NumberField({
                    fieldLabel: 'Longitud',
                    anchor: '95%',
                    readOnly: true,
                    decimalPrecision: Viewer.DEGREES_PRECISION
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
                })
            ]
        };

        this.add(c);
    }
});

Ext.reg('viewer_pointInformation', Viewer.dialog.PointInformation);
