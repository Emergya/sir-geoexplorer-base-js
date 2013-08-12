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

Viewer.widgets.SearchByCoordinates = Ext.extend(Ext.TabPanel, {

    constructor : function (config) {
        

        this.listeners = Ext.apply({
            beforerender : this.onBeforeRender,
            scope : this
        }, config.listeners || {});

        // IMPORTANT: The constructor call will override the listeners if
        // the config.listeners object is found.
        delete config.listeners;

        this.addEvents({
            buttonUtmClicked : true,
            buttonLonLatClicked : true,
            buttonDecimalClicked : true
        });

        this.prjUTM = new OpenLayers.Projection(Viewer.UTM_PROJECTION);
        this.prjGeo = new OpenLayers.Projection(Viewer.GEO_PROJECTION);
        this.coords = new Viewer.store.CoordinatesRecord({
            mapProjection : config.map.getProjectionObject(),
            utmProjection : this.prjUTM,
            decimalProjection : this.prjGeo
        });

        Viewer.widgets.SearchByCoordinates.superclass.constructor.call(this,
                Ext.apply({
                    cls : 'vw_search_by_coordinates',
                    activeTab : 0,
                    buttonUtmLabel : 'Button UTM',
                    buttonLonLatLabel : 'Button Lon/Lat',
                    buttonDecimalLabel : 'Button Decimal'
                }, config));
    },

    clear : function () {
        this.txtUtmX.setValue('');
        this.txtUtmY.setValue('');
        this.txtLonDeg.setValue('');
        this.txtLonMin.setValue('');
        this.txtLonSec.setValue('');
        this.txtLatDeg.setValue('');
        this.txtLatMin.setValue('');
        this.txtLatSec.setValue('');
        this.txtLonDecimal.setValue('');
        this.txtLatDecimal.setValue('');
    },

    onBtnUtmClicked : function () {
        if (this.formUTM.getForm().isValid()) {
            var point = new OpenLayers.LonLat(this.txtUtmX.getValue(), this.txtUtmY
                    .getValue());
    
            this.coords.setUTM(point);
            
            if (!this.validateCoordinates()) {
            	Ext.MessageBox.alert("Error en coordenadas", "Coordenadas fuera de rango");
            } else {
            	this.formLonLat.getForm().loadRecord(this.coords);
            	this.formDecimal.getForm().loadRecord(this.coords);
            	this.fireEvent('buttonUtmClicked', this.coords);
            }
    
        } else {
            Ext.MessageBox.alert("Introduzca las coordenadas", 
            "Introduzca las coordenadas X e Y.");
        }
    },

    onBtnLonLatClicked : function () {
        if (this.formLonLat.getForm().isValid()) {
            var point = {
                lon : {
                    deg : this.txtLonDeg.getValue(),
                    min : this.txtLonMin.getValue(),
                    sec : this.txtLonSec.getValue(),
                
                    east : this.cmbEast.getValue()
                },
                lat : {
                    deg : this.txtLatDeg.getValue(),
                    min : this.txtLatMin.getValue(),
                    sec : this.txtLatSec.getValue(),
                    north : this.cmbNorth.getValue()
                }
            };
    
            this.coords.setDegrees(point);
            
            if (!this.validateCoordinates()) {
                Ext.MessageBox.alert("Error en coordenadas", "Coordenadas fuera de rango");
            } else {
            	this.formUTM.getForm().loadRecord(this.coords);
            	this.formDecimal.getForm().loadRecord(this.coords);
            	this.fireEvent('buttonLonLatClicked', this.coords);
            }
    
        } else {
            Ext.MessageBox.alert("Introduzca las coordenadas", 
            "Introduzca la latitud y longitud en grados, minutos y segundos");
        }
    },

    onBtnDecimalClicked : function () {
        if (this.formDecimal.getForm().isValid()) {
            var point = new OpenLayers.LonLat(this.txtLonDecimal.getValue(),
                    this.txtLatDecimal.getValue());
    
            this.coords.setDecimal(point);
            
            if (!this.validateCoordinates()) {
            	Ext.MessageBox.alert("Error en coordenadas", "Coordenadas fuera de rango");
            } else {
            	this.formUTM.getForm().loadRecord(this.coords);
            	this.formLonLat.getForm().loadRecord(this.coords);
            	this.fireEvent('buttonDecimalClicked', this.coords);
            }
    
        } else {
            Ext.MessageBox.alert("Introduzca las coordenadas", 
                    "Introduzca la latitud y longitud en grados decimales.");
        }
    },
    
    validateCoordinates: function () {
		 var latDecimal = this.coords.get('lat_decimal');
	     var lonDecimal = this.coords.get('lon_decimal');
	     
	     if (lonDecimal < this.minLon || lonDecimal > this.maxLon || latDecimal < this.minLat || latDecimal > this.maxLat) {
	     	return false;
	     } else {
	    	 return true;
	     }
	},

    onBeforeRender : function () {
    	
        //Max an Min lot lan in decimal
        this.minLon = -78.91935;
        this.maxLon = -65.68393;
        this.minLat = -56.96844;
        this.maxLat = -16.48775;

        this.txtUtmX = new Ext.form.NumberField({
            name : 'utm_x',
            fieldLabel : 'X',
            decimalPrecision : Viewer.UTM_PRECISION,
            allowBlank: false
        });
        this.txtUtmY = new Ext.form.NumberField({
            name : 'utm_y',
            fieldLabel : 'Y',
            decimalPrecision : Viewer.UTM_PRECISION,
            allowBlank: false
        });
        this.btnUtmSearch = new Ext.Button({
            text : this.buttonUtmLabel,
            listeners : {
                click : this.onBtnUtmClicked,
                scope : this
            }
        });

        var storeNorth = new Ext.data.SimpleStore({
            fields : [ 'id', 'value' ],
            data : [ [ 'N', 'N' ], [ 'S', 'S' ] ]
        });

        var storeEast = new Ext.data.SimpleStore({
            fields : [ 'id', 'value' ],
            data : [ [ 'E', 'E' ], [ 'W', 'W' ] ]
        });

        var cmbConfig = {
            editable : false,
            valueField : 'id',
            displayField : 'value',
            mode : 'local',
            triggerAction : 'all',
            flex : 1, 
            allowBlank: false
        };

        this.txtLonDeg = new Ext.form.NumberField({
            name : 'lon_deg',
            fieldLabel : 'Longitud',
            flex : 1,
            allowDecimals: false,
            allowBlank: false
        });
        this.txtLonMin = new Ext.form.NumberField({
            name : 'lon_min',
            flex : 1,
            allowDecimals: false,
            allowBlank: false
        });
        this.txtLonSec = new Ext.form.NumberField({
            name : 'lon_sec',
            flex : 1,
            decimalPrecision : Viewer.SECONDS_PRECISION,
            allowBlank: false
        });
        this.cmbEast = new Ext.form.ComboBox(Ext.apply({
            name : 'east',
            store : storeEast
        }, cmbConfig));
        this.txtLatDeg = new Ext.form.NumberField({
            name : 'lat_deg',
            fieldLabel : 'Latitud',
            flex : 1,
            allowDecimals: false,
            allowBlank: false
        });
        this.txtLatMin = new Ext.form.NumberField({
            name : 'lat_min',
            flex : 1,
            allowDecimals: false,
            allowBlank: false
        });
        this.txtLatSec = new Ext.form.NumberField({
            name : 'lat_sec',
            flex : 1,
            decimalPrecision : Viewer.SECONDS_PRECISION,
            allowBlank: false
        });
        this.cmbNorth = new Ext.form.ComboBox(Ext.apply({
            name : 'north',
            store : storeNorth
        }, cmbConfig));
        this.btnLonLatSearch = new Ext.Button({
            text : this.buttonLonLatLabel,
            listeners : {
                click : this.onBtnLonLatClicked,
                scope : this
            }
        });

        this.txtLonDecimal = new Ext.form.NumberField({
            name : 'lon_decimal',
            fieldLabel : 'Longitud',
            decimalPrecision : Viewer.DEGREES_PRECISION,
            allowBlank: false
        });
        this.txtLatDecimal = new Ext.form.NumberField({
            name : 'lat_decimal',
            fieldLabel : 'Latitud',
            decimalPrecision : Viewer.DEGREES_PRECISION,
            allowBlank: false
        });
        this.btnLonLatDecimalSearch = new Ext.Button({
            text : this.buttonDecimalLabel,
            listeners : {
                click : this.onBtnDecimalClicked,
                scope : this
            }
        });

        var padding = 'padding: 10px 16px;';
        var border = 'border: 0px solid transparent;';

        this.add([ {
            title : 'UTM',
            xtype : 'container',
            layout : 'fit',
            defaults : {
                bodyStyle : padding + border
            },
            items : this.formUTM = new Ext.form.FormPanel({
                cls : 'vw_default_search_form_utm',
                xtype : 'form',
                defaults : {
                    labelWidth : 15
                },
                items : [ this.txtUtmX, this.txtUtmY ],
                buttons : [ this.btnUtmSearch ]
            })
        }, {
            title : 'Geográficas (Sexagesimal)',
            layout : 'fit',
            defaults : {
                bodyStyle : padding + border
            },
            items : this.formLonLat = new Ext.form.FormPanel({
                cls : 'vw_default_search_form_lonlat',
                xtype : 'form',
                layout : 'fit',
                defaults : {
                    labelWidth : 15
                },
                items : {
                    xtype : 'container',
                    layout : {
                        type : 'vbox',
                        align : 'stretch'
                    },
                    items : [ {
                        xtype : 'container',
                        layout : {
                            type : 'hbox'
                        },
                        items : [ {
                            flex : 1,
                            xtype : 'label',
                            text : 'Latitud'
                        }, this.txtLatDeg, {
                            flex : 1,
                            xtype : 'label',
                            text : 'º'
                        }, this.txtLatMin, {
                            flex : 1,
                            xtype : 'label',
                            text : "'"
                        }, this.txtLatSec, {
                            flex : 1,
                            xtype : 'label',
                            text : '"'
                        }, this.cmbNorth ]
                    }, {
                        xtype : 'container',
                        // flex: 1,
                        layout : {
                            type : 'hbox'
                        },
                        items : [ {
                            flex : 1,
                            xtype : 'label',
                            text : 'Longitud'
                        }, this.txtLonDeg, {
                            flex : 1,
                            xtype : 'label',
                            text : 'º'
                        }, this.txtLonMin, {
                            flex : 1,
                            xtype : 'label',
                            text : "'"
                        }, this.txtLonSec, {
                            flex : 1,
                            xtype : 'label',
                            text : '"'
                        }, this.cmbEast ]
                    } ]
                },
                buttons : [ this.btnLonLatSearch ]
            })
        }, {
            title : 'Geográficas (Decimal)',
            layout : 'fit',
            defaults : {
                bodyStyle : padding + border
            },
            items : this.formDecimal = new Ext.form.FormPanel({
                cls : 'vw_default_search_form_decimal',
                xtype : 'form',
                defaults : {
                    labelWidth : 15
                },
                items : [ this.txtLatDecimal, this.txtLonDecimal ],
                buttons : [ this.btnLonLatDecimalSearch ]
            })
        } ]);
    }

});

Ext.reg('vw_search_by_coordinates', Viewer.widgets.SearchByCoordinates);

