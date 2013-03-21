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
 * Author: Juan Luis Rodriguez Ponce <jlrodriguez@emergya.com>
 */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Control/ScaleLine.js
 */

/**
 * Class: OpenLayers.Control.CustomMousePosition The MousePosition control
 * displays geographic coordinates of the mouse pointer, as it is moved about
 * the map. It displays coordinates in two reference systems.
 * 
 * Inherits from: - <OpenLayers.Control>
 */
OpenLayers.Control.CustomMousePosition = OpenLayers.Class(OpenLayers.Control, {

    /**
     * APIProperty: autoActivate {Boolean} Activate the control when it is added
     * to a map. Default is true.
     */
    autoActivate : true,

    /**
     * Property: element {DOMElement}
     */
    element : null,

    /**
     * APIProperty: numDigits {Integer} The number of digits each coordinate
     * shall have when being rendered, Defaults to 5.
     */
    numDigits : 5,

    /**
     * APIProperty: numUtmDigits {Integer} The number of digits each UTM
     * coordinate shall have when being rendered, Defaults to 0.
     */
    numUtmDigits : 0,

    /**
     * APIProperty: granularity {Integer}
     */
    granularity : 10,

    /**
     * APIProperty: emptyString {String} Set this to some value to set when the
     * mouse is outside the map.
     */
    emptyString : null,

    /**
     * Property: lastXy {<OpenLayers.Pixel>}
     */
    lastXy : null,

    /**
     * APIProperty: displayProjection {<OpenLayers.Projection>} The projection
     * in which the mouse position is displayed.
     */
    displayProjection : null,

    /**
     * APIProperty: utmDisplayProjection {<OpenLayers.Projection>} The UTM
     * projection in which the mouse position is displayed.
     */
    utmDisplayProjection : null,
    /**
     * APIProperty: datum {String} Set the datum displayed in the control.
     */
    datum: "WGS84",
    
    utmProjections: {
        "17": new OpenLayers.Projection("EPSG:32717"),    
        "18": new OpenLayers.Projection("EPSG:32718"),
        "19": new OpenLayers.Projection("EPSG:32719"),
        "20": new OpenLayers.Projection("EPSG:32720")},
    utmProjectionPrefix: "EPSG:327",
    wgs84LatLonProjection: new OpenLayers.Projection("EPSG:4326"),
    dmsCoordinatesFormat: true,

   
    /**
     * Constructor: OpenLayers.Control.MousePosition
     * 
     * Parameters: options - {Object} Options for control.
     */

    /**
     * Method: destroy
     */
    destroy : function () {
        this.deactivate();
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    /**
     * APIMethod: activate
     */
    activate : function () {
        if (OpenLayers.Control.prototype.activate.apply(this, arguments)) {
            this.map.events.register('mousemove', this, this.redraw);
            this.map.events.register('mouseout', this, this.reset);
            this.redraw();
            // if(this.scaleLineControl) {
            // this.scaleLineControl.activate();
            // }
            return true;
        } else {
            return false;
        }
    },

    /**
     * APIMethod: deactivate
     */
    deactivate : function () {
        if (OpenLayers.Control.prototype.deactivate.apply(this, arguments)) {
            this.map.events.unregister('mousemove', this, this.redraw);
            this.map.events.unregister('mouseout', this, this.reset);
            this.element.innerHTML = "";
            // if(this.scaleLineControl) {
            // this.scaleLineControl.activate();
            // }
            return true;
        } else {
            return false;
        }
    },

    /**
     * Method: draw {DOMElement}
     */
    draw : function () {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        if (!this.element) {
            var datumDiv = OpenLayers.Util.createDiv(this.id + "DatumDiv", null, 
                    null, null, 'relative');
            var latDiv = OpenLayers.Util.createDiv(this.id + "LatDiv", null,
                    null, null, 'relative');
            var lonDiv = OpenLayers.Util.createDiv(this.id + "LongDiv", null,
                    null, null, 'relative');
            var changeDisplayDiv = OpenLayers.Util.createDiv(this.id + 
                    "changeDisplayDiv", null, null, null, 'relative');
            var utmZoneDiv = OpenLayers.Util.createDiv(this.id + "utmZoneDiv",
                    null, null, null, 'relative');
            var xDiv = OpenLayers.Util.createDiv(this.id + "XDiv", null, null,
                    null, 'relative');
            var yDiv = OpenLayers.Util.createDiv(this.id + "YDiv", null, null,
                    null, 'relative');
            var coordinatesDiv = OpenLayers.Util.createDiv(
                    this.id + "coordDiv", null, null, null, 'relative');
            coordinatesDiv.className = "coordinatesDiv";
            OpenLayers.Element.addClass(datumDiv, 'lonlatDiv');
            OpenLayers.Element.addClass(latDiv, 'lonlatDiv');
            OpenLayers.Element.addClass(lonDiv, 'lonlatDiv');
            OpenLayers.Element.addClass(changeDisplayDiv, 'changeDisplayDiv');
            OpenLayers.Element.addClass(utmZoneDiv, 'lonlatDiv');
            OpenLayers.Element.addClass(xDiv, 'lonlatDiv');
            OpenLayers.Element.addClass(yDiv, 'lonlatDiv');

            // datum
            var datumLabel = document.createElement('span');
            var datumLabelText = document.createTextNode('Datum:');
            datumLabel.appendChild(datumLabelText);
            datumLabel = OpenLayers.Element.addClass(datumLabel, 'lonlatLabel');
            var datumValue = document.createElement('span');
            var datumValueText = document.createTextNode(this.datum);
            OpenLayers.Element.addClass(datumValue, 'lonlatValue');
            datumValue.appendChild(datumValueText);
            datumDiv.appendChild(datumLabel);
            datumDiv.appendChild(datumValue);


            // longitude
            var lonLabel = document.createElement('span');
            var lonLabelText = document.createTextNode('Longitud:');
            lonLabel.appendChild(lonLabelText);
            lonLabel = OpenLayers.Element.addClass(lonLabel, 'lonlatLabel');
            var lonValue = document.createElement('span');
            OpenLayers.Element.addClass(lonValue, 'lonlatValue');
            lonDiv.appendChild(lonLabel);
            lonDiv.appendChild(lonValue);

            // latitude
            var latLabel = document.createElement('span');
            var latLabelText = document.createTextNode('Latitud:');
            latLabel.appendChild(latLabelText);
            latLabel = OpenLayers.Element.addClass(latLabel, 'lonlatLabel');
            var latValue = document.createElement('span');
            latValue = OpenLayers.Element.addClass(latValue, 'lonlatValue');
            latDiv.appendChild(latLabel);
            latDiv.appendChild(latValue);
            
            // DMS/Decimal button
            var button = new Ext.Button({
                cls: 'changeDisplayButton',
                text: "Mostrar en Decimal",
                renderTo: changeDisplayDiv,
                listeners: {
                   "click": {
                       fn: this.toggleCoordinatesFormat, 
                       scope: this
                   }
                }
            });
            this.button = button;
          

            // UTM zone
            var utmZoneLabel = document.createElement('span');
            var utmZoneLabelText = document.createTextNode('Huso UTM:');
            utmZoneLabel.appendChild(utmZoneLabelText);
            utmZoneLabel = OpenLayers.Element.addClass(utmZoneLabel,
                    'lonlatLabel');
            var utmZoneValue = document.createElement('span');
            utmZoneValue = OpenLayers.Element.addClass(utmZoneValue,
                    'lonlatValue');
            utmZoneDiv.appendChild(utmZoneLabel);
            utmZoneDiv.appendChild(utmZoneValue);

            // X coord
            var xLabel = document.createElement('span');
            var xLabelText = document.createTextNode('Coordenada X:');
            xLabel.appendChild(xLabelText);
            xLabel = OpenLayers.Element.addClass(xLabel, 'lonlatLabel');
            var xValue = document.createElement('span');
            xValue = OpenLayers.Element.addClass(xValue, 'lonlatValue');
            xDiv.appendChild(xLabel);
            xDiv.appendChild(xValue);

            // Y coord
            var yLabel = document.createElement('span');
            var yLabelText = document.createTextNode('Coordenada Y:');
            yLabel.appendChild(yLabelText);
            yLabel = OpenLayers.Element.addClass(yLabel, 'lonlatLabel');
            var yValue = document.createElement('span');
            yValue = OpenLayers.Element.addClass(yValue, 'lonlatValue');
            yDiv.appendChild(yLabel);
            yDiv.appendChild(yValue);

            // Add to coordinatesDiv
            coordinatesDiv.appendChild(datumDiv);
            coordinatesDiv.appendChild(lonDiv);
            coordinatesDiv.appendChild(latDiv);
            coordinatesDiv.appendChild(changeDisplayDiv);
            coordinatesDiv.appendChild(utmZoneDiv);
            coordinatesDiv.appendChild(xDiv);
            coordinatesDiv.appendChild(yDiv);

            this.div.appendChild(coordinatesDiv);
            this.latSpan = latValue;
            this.lonSpan = lonValue;
            this.utmZoneSpan = utmZoneValue;
            this.xSpan = xValue;
            this.ySpan = yValue;

            this.element = this.div;
        }

        return this.div;
    },

    /**
     * Method: redraw
     */
    redraw : function (evt) {

        var lonLat;
        var lonLatDisplay;
        var lonLatUtm;
        var utmZone = "";

        if (!evt) {
            this.reset();
            return;
        } else {
            if (this.lastXy === null
                    || Math.abs(evt.xy.x - this.lastXy.x) > this.granularity
                    || Math.abs(evt.xy.y - this.lastXy.y) > this.granularity) {
                this.lastXy = evt.xy;
                return;
            }

            lonLat = this.map.getLonLatFromPixel(evt.xy);
            if (!lonLat) {
                // map has not yet been properly initialized
                return;
            }

            lonLatDisplay = lonLat.clone();
            lonLatUtm = lonLat.clone();

            if (this.displayProjection) {
                lonLatDisplay.transform(this.map.getProjectionObject(),
                        this.displayProjection);
            }
            
            utmZone = this.getUtmZone(lonLat);
            lonLatUtm.transform(this.map.getProjectionObject(),
                        this.getUtmProjection(lonLat, utmZone));
            

            this.lastXy = evt.xy;

        }

        var lonlatValue = this.formatOutput(lonLatDisplay);
        var xyValue = this.formatUtmOutput(lonLatUtm);
        if (lonlatValue.lat != this.latSpan.innerHTML
                || lonlatValue.lon != this.lonSpan.innerHTML) {
            this.latSpan.innerHTML = lonlatValue.lat;
            this.lonSpan.innerHTML = lonlatValue.lon;
        }
        if (xyValue.x != this.xSpan.innerHTML
                || xyValue.y != this.ySpan.innerHTML
                || utmZone != this.utmZoneSpan.innerHTML) {
            this.utmZoneSpan.innerHTML = utmZone;
            this.xSpan.innerHTML = xyValue.x;
            this.ySpan.innerHTML = xyValue.y;
        }
    },

    /**
     * Method: reset
     */
    reset : function (evt) {
        if (this.emptyString !== null) {
            this.lonSpan.innerHTML = this.emptyString;
            this.latSpan.innerHTML = this.emptyString;
            this.xSpan.innerHTML = this.emptyString;
            this.ySpan.innerHTML = this.emptyString;
        }
    },

    /**
     * Method: formatOutput Override to provide custom display output
     * 
     * Parameters: lonLat - {<OpenLayers.LonLat>} Location to display
     */
    formatOutput : function (lonLat) {
        var digits = parseInt(this.numDigits, 10);
        var result = null;
        if (this.dmsCoordinatesFormat) {
            var longitude = this.lonLatToDMS(lonLat.lon);
            var latitude = this.lonLatToDMS(lonLat.lat);
           result = {
              lon: longitude[0] + "\u00B0 " + longitude[1] + "' " + longitude[2] + "\"",
              lat: latitude[0] + "\u00B0 " + latitude[1] + "' " + latitude[2] + "\"" 
            };            
        } else {
            result = {
              lon : lonLat.lon.toFixed(digits) + "\u00B0",
              lat : lonLat.lat.toFixed(digits) + "\u00B0"
            };
            
        }

        return result;
    },

    /**
     * Method: formatUtmOutput Override to provide custom display UTM output
     * 
     * Parameters: lonLat - {<OpenLayers.LonLat>} Location to display
     */
    formatUtmOutput : function (lonLat) {
        var digits = parseInt(this.numUtmDigits, 10);
        var result = {
            x : lonLat.lon.toFixed(digits) + " m",
            y : lonLat.lat.toFixed(digits) + " m"
        };

        return result;
    },
    
    getUtmProjection: function(mapCoordinates, utmZone) {
        var coord = mapCoordinates.clone();
        coord.transform(this.map.getProjectionObject(),
                this.wgs84LatLonProjection);
       
        var utmProj = this.utmProjections[utmZone];
        if (!utmProj) {
            if(""+utmZone)
            utmProj = new OpenLayers.Projection(this.utmProjectionPrefix + this.lpad(utmZone, 2));
            this.utmProjections[utmZone] = utmProj;
        }
        return utmProj;
        
    },
    
    getUtmZone: function (mapCoordinates) {
        var coord = mapCoordinates.clone();
        coord.transform(this.map.getProjectionObject(),
                this.wgs84LatLonProjection);
        return Math.floor((coord.lon + 186) / 6);
    },
    lpad: function (value, padding) {
        var zeroes = "0";

        for (var i = 0; i < padding; i++) { zeroes += "0"; }

        return (zeroes + value).slice(padding * -1);
    },
    
    toggleCoordinatesFormat: function() {
        this.dmsCoordinatesFormat = !this.dmsCoordinatesFormat;
        var evt = {
                xy: {
                    x: this.lastXy.x,
                    y: this.lastXy.y
                }
        };
        if (this.dmsCoordinatesFormat) {
            this.button.setText("Mostrar en Decimal");
        } else {
            this.button.setText("Mostrar en GG\u00B0 MM' SS\"");
        }
        this.redraw(evt);
    },
    
    lonLatToDMS: function(coord){
        var d = parseInt(coord, 10);
        var md = Math.abs(coord - d) * 60;
        var m = parseInt(md, 10);
        var sd = (md-m) * 60;
        return [d, m, sd.toFixed(3)];
    },
    
    

    CLASS_NAME : "OpenLayers.Control.CustomMousePosition"
});