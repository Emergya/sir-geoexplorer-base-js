/**
 * Copyright (c) 2008-2012 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/**
 * @include GeoExt/data/LayerRecord.js
 * @require OpenLayers/Format/WFSCapabilities.js
 * @require OpenLayers/Format/WFSCapabilities/v1_1_0.js
 * @require OpenLayers/Protocol/WFS.js
 * @require OpenLayers/Protocol/WFS/v1_0_0.js
 * @require OpenLayers/Strategy/Fixed.js
 * @require OpenLayers/Layer/Vector.js
 */

/** api: (define)
 *  module = GeoExt.data
 *  class = WFSCapabilitiesReader
 *  base_link = `Ext.data.DataReader <http://dev.sencha.com/deploy/dev/docs/?class=Ext.data.DataReader>`_
 */
Ext.namespace("GeoExt.data");

/** api: constructor
 *  .. class:: WFSCapabilitiesReader(meta, recordType)
 *  
 *      :param meta: ``Object`` Reader configuration from which:
 *          ``layerOptions`` is an optional object (or function that returns
 *          an object) passed as default options to the
 *          ``OpenLayers.Layer.Vector`` constructor.
 *          ``protocolOptions`` is an optional set of parameters to pass to the
 *          ``OpenLayers.Protocol.WFS`` constructor.
 *      :param recordType: ``Array | Ext.data.Record`` An array of field
 *          configuration objects or a record object.  Default is
 *          :class:`GeoExt.data.LayerRecord`.
 *   
 *      Data reader class to create an array of
 *      :class:`GeoExt.data.LayerRecord` objects from a WFS GetCapabilities
 *      response.
 */
GeoExt.data.WFSCapabilitiesReader = function(meta, recordType) {
    meta = meta || {};
    if(!meta.format) {
        meta.format = new OpenLayers.Format.WFSCapabilities();
    }
    if(!(typeof recordType === "function")) {
        recordType = GeoExt.data.LayerRecord.create(
            recordType || meta.fields || [
                {name: "name", type: "string"},
                {name: "title", type: "string"},
                {name: "namespace", type: "string", mapping: "featureNS"},
                {name: "abstract", type: "string"}
            ]
        );
    }
    GeoExt.data.WFSCapabilitiesReader.prototype.constructor.call(
        this, meta, recordType
    );
};

Ext.extend(GeoExt.data.WFSCapabilitiesReader, Ext.data.DataReader, {

    returnProjection: "EPSG:4326",

    constructor: function(config, recordType) {
        Ext.apply(this,config);
        GeoExt.data.WFSCapabilitiesReader.superclass.constructor.call(this, config, recordType);
    },

    /** private: method[read]
     *  :param request: ``Object`` The XHR object which contains the parsed XML
     *      document.
     *  :return: ``Object`` A data block which is used by an ``Ext.data.Store``
     *      as a cache of ``Ext.data.Record`` objects.
     */
    read: function(request) {
        var data = request.responseXML;
        if(!data || !data.documentElement) {
            data = request.responseText;
        }
        return this.readRecords(data);
    },

    /** private: method[loadDescribeFeature]
     *  :param record: ``Object`` The record to be filled
     *
     *  Fill record.layer.protocol.geometryName searching in XML schema 
     */
    loadDescribeFeature: function(record) {
        var featureTypeName = record.data.layer.protocol.featureType;
        
        OpenLayers.Request.GET({
            url: OpenLayers.ProxyHost + record.data.layer.protocol.url,
            params: {
                "SERVICE": "WFS",
                "REQUEST": "DescribeFeatureType",
                "NAMESPACE": record.data.layer.protocol.featureNS,
                "VERSION": record.data.layer.protocol.version,
                "TYPENAME": featureTypeName
            },
            callback: this.describeFeatureTypeLoaded,
            scope: {
                self_: this, 
                name: record.data.name, 
                namespace: record.data.namespace,
                record: record,
                loadingAttributes: this.loadingAttributes,
                listeners: this.listeners,
                fireEvent: this.fireEvent,
                fillGeomName: this.fillGeomName
            }
        });
    },
    
    /** private: method[describeFeatureTypeLoaded]
     *  :param request: ``Object`` The XHR object which contains the parsed XML
     *      document.
     *
     *  Search 'gml:GeometryPropertyType' in XML schema an call to 'fillGeomName'
     */
    describeFeatureTypeLoaded: function(request) {
        if (request.status == 200) {
                try {
                    var attributeStore = new GeoExt.data.AttributeStore(
                            {
                                listeners:{
                                'load': function(store,records,options){
                                    for (var i = 0; i< records.length; i++){
                                        if(records[i].data.type 
                                                == 'gml:GeometryPropertyType'){
                                            this.fillGeomName(this.record, 
                                                    records[i].data.name);
                                        }
                                    }
                                },
                                scope: this
                            }});;
                    attributeStore.loadData(request.responseXML);
                    
                } catch (e) {
                    //For debug: console.log(e.stack);
                }
            }


    },
    

    /** private: method[fillGeomName]
     *  :param record: ``Object`` The record to be filled
     *  :param geomName: ``String`` The geometry property find
     *
     *  Fill record.layer.protocol.geometryName with 'geomName'
     */
    fillGeomName: function(record, geomName){
        record.data.layer.protocol.geometryName = geomName;
    },

    /** private: method[readRecords]
     *  :param data: ``DOMElement | String | Object`` A document element or XHR
     *      response string.  As an alternative to fetching capabilities data
     *      from a remote source, an object representing the capabilities can
     *      be provided given that the structure mirrors that returned from the
     *      capabilities parser.
     *  :return: ``Object`` A data block which is used by an ``Ext.data.Store``
     *      as a cache of ``Ext.data.Record`` objects.
     *  
     *  Create a data block containing Ext.data.Records from an XML document.
     */
    readRecords: function(data) {
        if(typeof data === "string" || data.nodeType) {
            data = this.meta.format.read(data);
        }

        var featureTypes = data.featureTypeList.featureTypes;
        var fields = this.recordType.prototype.fields;

        var featureType, values, field, v, parts, layer;
        var layerOptions, protocolOptions;

        var url = (parseFloat(data.version) >= 1.1) ? 
            data.operationsMetadata 
                && (data.operationsMetadata["GetFeature"].dcp.http.post[0].url 
                        ||  data.operationsMetadata["GetFeature"].dcp.http.post): //ol 2.11
            data.capability.request.getfeature.href.post;

        var protocolDefaults = {
            url: url
        };
        var version = data.version;
        if (version) {
            protocolDefaults.version = version;
        }

        var records = [];

        for(var i=0, lenI=featureTypes.length; i<lenI; i++) {
            featureType = featureTypes[i];
            if(featureType.name) {
                values = {};

                for(var j=0, lenJ=fields.length; j<lenJ; j++) {
                    field = fields.items[j];
                    v = featureType[field.mapping || field.name] ||
                        field.defaultValue;
                    v = field.convert(v);
                    values[field.name] = v;
                }
                
                var featureTypeName = featureType.name;

                protocolOptions = {
                    featureType: featureTypeName,
                    featureNS: featureType.featureNS,
                    srsName: this.returnProjection
                };
                if(this.meta.protocolOptions) {
                    Ext.apply(protocolOptions, this.meta.protocolOptions, 
                        protocolDefaults);
                } else {
                    Ext.apply(protocolOptions, {}, protocolDefaults);
                }

                layerOptions = {
                    protocol: new OpenLayers.Protocol.WFS(protocolOptions),
                    strategies: [new OpenLayers.Strategy.Fixed()]
                };
                var metaLayerOptions = this.meta.layerOptions;
                if (metaLayerOptions) {
                    Ext.apply(layerOptions, Ext.isFunction(metaLayerOptions) ?
                        metaLayerOptions() : metaLayerOptions);
                }

                values.layer = new OpenLayers.Layer.Vector(
                    featureType.title || featureType.name,
                    layerOptions
                );
                
                var record = new this.recordType(values, values.layer.id);
                
                this.loadDescribeFeature(record);

                records.push(record);
            }
        }
        return {
            totalRecords: records.length,
            success: true,
            records: records
        };
    }
});
