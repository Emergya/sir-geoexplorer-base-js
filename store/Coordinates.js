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

Viewer.store.AbstractCoordinatesRecord = Ext.data.Record.create([
    { name: 'utm_x', type: 'float', allowBlank: false },
    { name: 'utm_y', type: 'float', allowBlank: false },
    { name: 'lon_decimal', type: 'float', allowBlank: false },
    { name: 'lat_decimal', type: 'float', allowBlank: false },
    { name: 'lon_deg', type: 'float', allowBlank: false },
    { name: 'lon_min', type: 'float', allowBlank: false },
    { name: 'lon_sec', type: 'float', allowBlank: false },
    { name: 'east', type: 'string', allowBlank: false },
    { name: 'lat_deg', type: 'float', allowBlank: false },
    { name: 'lat_min', type: 'float', allowBlank: false },
    { name: 'lat_sec', type: 'float', allowBlank: false },
    { name: 'north', type: 'string', allowBlank: false }
]);

Viewer.store.CoordinatesRecord = Ext.extend(Viewer.store.AbstractCoordinatesRecord, {

    mapProjection: null,
    utmProjection: null,
    decimalProjection: null,

    constructor: function(config) {
        Viewer.store.CoordinatesRecord.superclass.constructor.call(this, config);
        this.mapProjection = config.mapProjection;
        this.utmProjection = config.utmProjection;
        this.decimalProjection = config.decimalProjection;
    },

    getUTMPoint: function() {
        return new OpenLayers.LonLat(this.get('utm_x'), this.get('utm_y'));
    },

    getDecimalPoint: function() {
        return new OpenLayers.LonLat(this.get('lon_decimal'), this.get('lat_decimal'));
    },

    getPoint: function(projection) {
        var pUTM = this.getUTMPoint();
        var point = pUTM.clone().transform(this.utmProjection, projection);
        point.lat = point.lat.toFixed(Viewer.DEGREES_PRECISION);
        point.lon = point.lon.toFixed(Viewer.DEGREES_PRECISION);
        return point;
    },

    setUTM: function(pUTM) {
        this.beginEdit();

        var pMap = pUTM.clone().transform(this.utmProjection, this.mapProjection);
        var pDecimal = pMap.transform(this.mapProjection, this.decimalProjection);
        var pDegrees = this._toDegrees(pDecimal);

        this.set('utm_x', pUTM.lon.toFixed(Viewer.UTM_PRECISION));
        this.set('utm_y', pUTM.lat.toFixed(Viewer.UTM_PRECISION));
        this.set('lon_decimal', pDecimal.lon.toFixed(Viewer.DEGREES_PRECISION));
        this.set('lat_decimal', pDecimal.lat.toFixed(Viewer.DEGREES_PRECISION));
        this.set('lon_deg', pDegrees.lon.deg);
        this.set('lon_min', pDegrees.lon.min);
        this.set('lon_sec', pDegrees.lon.sec);
        this.set('east', pDegrees.lon.east);
        this.set('lat_deg', pDegrees.lat.deg);
        this.set('lat_min', pDegrees.lat.min);
        this.set('lat_sec', pDegrees.lat.sec);
        this.set('north', pDegrees.lat.north);

        this.endEdit(); 
        this.commit();
    },

    setDecimal: function(pDecimal) {
        this.beginEdit();

        var pMap = pDecimal.clone().transform(this.decimalProjection, this.mapProjection);
        var pUTM = pMap.transform(this.mapProjection, this.utmProjection);
        var pDegrees = this._toDegrees(pDecimal);

        this.set('utm_x', pUTM.lon.toFixed(Viewer.UTM_PRECISION));
        this.set('utm_y', pUTM.lat.toFixed(Viewer.UTM_PRECISION));
        this.set('lon_decimal', pDecimal.lon.toFixed(Viewer.DEGREES_PRECISION));
        this.set('lat_decimal', pDecimal.lat.toFixed(Viewer.DEGREES_PRECISION));
        this.set('lon_deg', pDegrees.lon.deg);
        this.set('lon_min', pDegrees.lon.min);
        this.set('lon_sec', pDegrees.lon.sec);
        this.set('east', pDegrees.lon.east);
        this.set('lat_deg', pDegrees.lat.deg);
        this.set('lat_min', pDegrees.lat.min);
        this.set('lat_sec', pDegrees.lat.sec);
        this.set('north', pDegrees.lat.north);

        this.endEdit(); 
        this.commit();
    },

    setDegrees: function(pDegrees) {
        this.beginEdit();

        var pDecimal = this._toDecimal(pDegrees);
        var pMap = pDecimal.clone().transform(this.decimalProjection, this.mapProjection);
        var pUTM = pMap.transform(this.mapProjection, this.utmProjection);

        this.set('utm_x', pUTM.lon.toFixed(Viewer.UTM_PRECISION));
        this.set('utm_y', pUTM.lat.toFixed(Viewer.UTM_PRECISION));
        this.set('lon_decimal', pDecimal.lon.toFixed(Viewer.DEGREES_PRECISION));
        this.set('lat_decimal', pDecimal.lat.toFixed(Viewer.DEGREES_PRECISION));
        this.set('lon_deg', pDegrees.lon.deg);
        this.set('lon_min', pDegrees.lon.min);
        this.set('lon_sec', pDegrees.lon.sec);
        this.set('east', pDegrees.lon.east);
        this.set('lat_deg', pDegrees.lat.deg);
        this.set('lat_min', pDegrees.lat.min);
        this.set('lat_sec', pDegrees.lat.sec);
        this.set('north', pDegrees.lat.north);

        this.endEdit(); 
        this.commit();
    },

    _toDegrees: function(pDecimal) {

        var lon = OpenLayers.Util.getFormattedLonLat(pDecimal.lon, 'lon', 'dms');
        var lat = OpenLayers.Util.getFormattedLonLat(pDecimal.lat, 'lat', 'dms');

        var r = /([\d\.]+)[^\d]([\d\.]+)[^\d]([\d\.]+)[^\d]([^\d])/;
        lon = r.exec(lon);
        lat = r.exec(lat);

        return {
            lon: { deg: parseFloat(lon[1]), min: parseFloat(lon[2]), sec: parseFloat(lon[3]), east: lon[4].toUpperCase() },
            lat: { deg: parseFloat(lat[1]), min: parseFloat(lat[2]), sec: parseFloat(lat[3]), north: lat[4].toUpperCase() }
        };
    },

    _toDecimal: function(pDegrees) {

        var lon = (pDegrees.lon.deg + (pDegrees.lon.min / 60) + (pDegrees.lon.sec / 3600)) * (pDegrees.lon.east == 'E' ? 1 : -1);
        var lat = (pDegrees.lat.deg + (pDegrees.lat.min / 60) + (pDegrees.lat.sec / 3600)) * (pDegrees.lat.north == 'N' ? 1 : -1);
        return new OpenLayers.LonLat(lon, lat);
    }
});

