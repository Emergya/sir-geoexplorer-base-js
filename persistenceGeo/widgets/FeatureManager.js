/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins/FeatureManager.js
 */

/** api: (define)
 *  module = PersistenceGeo.widgets
 *  class = FeatureManager
 * 
 * Includes fetch schema for WFS querying for WFS and WMS layers not loaded by a 
 * layer source method (GXP).
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("PersistenceGeo.widgets");

/** api: constructor
 *  .. class:: FeatureManager(config)
 *
 *    Plugin for a shared feature manager that other tools can reference. Works
 *    on layers added by the :class:`gxp.plugins.WMSSource` plugin, if there is
 *    a WFS resource advertized in the layer's DescribeLayer document.
 * 
 *    Added WFS and WMS not sourced support
 *
 *    The FeatureManager handles WFS feature loading, filtering, paging and
 *    transactions.
 */   
PersistenceGeo.widgets.FeatureManager = Ext.extend(gxp.plugins.FeatureManager, {
    
    /** api: ptype = pgeo_featuremanager */
    ptype: "pgeo_featuremanager",
    
    /** api: config[maxFeatures]
     *  ``Number`` Default is 100
     */
    maxFeatures: 100,
    
    /** api: config[paging]
     *  ``Boolean`` Should paging be enabled? Default is true.
     */
    paging: true,

    /**
     * api: method[getSchemaFromWMS]
     * Obtain schema for WFS queries relationed with a WMS
     **/
    getSchemaFromWMS: function(filter, autoLoad, record, source){
        if(!!source){
            source.getSchema(record, function(schema) {
                    if (schema === false) {
                        this.clearFeatureStore();
                        this.fireEvent("layerchange", this, record, schema);
                    } else {
                       this.prepareWFS(filter, autoLoad, record, source, schema);
                    }
                }, this);
        }else{
            var url = record.getLayer().url.replace("wms", "wfs").replace("WMS", "WFS");
            var typeName = record.getLayer().params.LAYERS;
            this.fetchSchema(url, typeName, function(schema){
                    this.prepareWFS(filter, autoLoad, record, source, schema);
            }, this);
        }
    },
    
    /**
     * api: method[getSchemaFromWFS]
     * Obtain schema for WFS queries relationed with a WFS
     **/
    getSchemaFromWFS: function (filter, autoLoad, record, source){
        var url = record.getLayer().protocol.url;
        var typeName = record.getLayer().protocol.featureType;
        this.fetchSchema(url, typeName, function(schema){
                this.prepareWFS(filter, autoLoad, record, source, schema);
        }, this);
    },
    
    /** private: property[schemaCache]
     */
    schemaCache: {},

    /** private: method[fetchSchema]
     *  :arg url: ``String`` The url fo the WFS endpoint
     *  :arg typeName: ``String`` The typeName to use
     *  :arg callback: ``Function`` Callback function. Will be called with
     *      a ``GeoExt.data.AttributeStore`` containing the schema as first
     *      argument, or false if the WMS does not support DescribeLayer or the
     *      layer is not associated with a WFS feature type.
     *  :arg scope: ``Object`` Optional scope for the callback.
     *
     *  Helper function to fetch the schema for a layer of this source.
     *
     *  @see plugins/WMSSource.js
     */
    fetchSchema: function(url, typeName, callback, scope) {
        var schema = this.schemaCache[typeName];
        if (schema) {
            if (schema.getCount() == 0) {
                schema.on("load", function() {
                    callback.call(scope, schema);
                }, this, {single: true});
            } else {
                callback.call(scope, schema);
            }
        } else {
            var urlAndBaseParams = this.getBaseParamsAndUrl(url, typeName);

            schema = new GeoExt.data.AttributeStore({
                url: urlAndBaseParams.url,
                baseParams: urlAndBaseParams.baseParams,
                autoLoad: true,
                listeners: {
                    "load": function() {
                        callback.call(scope, schema);
                    },
                    scope: this
                }
            });
            this.schemaCache[typeName] = schema;
        }
    },

    getBaseParamsAndUrl: function(url, typeName){
        var urlRet = url;    
        var baseParams = {
            SERVICE: "WFS",
            //TODO should get version from WFS GetCapabilities
            version: "1.1.0",
            request: "DescribeFeatureType",
            typeName: typeName
        };
        if(url.indexOf("?") > 0){
            urlRet = url.split("?")[0];
        }
        // if(url.indexOf("service") == -1
        //     && url.indexOf("SERVICE") == -1){
        //     baseParams["SERVICE"] = "WFS";
        // }
        return {
            baseParams: baseParams,
            url: urlRet
        };
    },
    
    /**
     * api: method[prepareWFS]
     * Prepare WFS query with a attribute schema
     **/
    prepareWFS: function(filter, autoLoad, record, source, schema){
        var fields = [], geometryName;
        var geomRegex = /gml:((Multi)?(Point|Line|Polygon|Curve|Surface|Geometry)).*/;
        var types = {
            "xsd:boolean": "boolean",
            "xsd:int": "int",
            "xsd:integer": "int",
            "xsd:short": "int",
            "xsd:long": "int",
            "xsd:date": "date",
            "xsd:string": "string",
            "xsd:float": "float",
            "xsd:double": "float"
        };
        schema.each(function(r) {
            var match = geomRegex.exec(r.get("type"));
            if (match) {
                geometryName = r.get("name");
                this.geometryType = match[1];
            } else {
                // TODO: use (and improve if needed) GeoExt.form.recordToField
                var type = types[r.get("type")];
                var field = {
                    name: r.get("name"),
                    type: types[type]
                };
                //TODO consider date type handling in OpenLayers.Format
                if (type == "date") {
                    field.dateFormat = "Y-m-d\\Z";
                }
                fields.push(field);
            }
        }, this);
        
        var protocolOptions = {
            srsName: this.getProjection(record).getCode(),
            url: schema.url,
            featureType: schema.reader.raw.featureTypes[0].typeName,
            featureNS: schema.reader.raw.targetNamespace,
            geometryName: geometryName
        };
        this.hitCountProtocol = new OpenLayers.Protocol.WFS(Ext.apply({
            version: "1.1.0",
            readOptions: {output: "object"},
            resultType: "hits",
            filter: filter
        }, protocolOptions));
        this.featureStore = new gxp.data.WFSFeatureStore(Ext.apply({
            fields: fields,
            proxy: {
                protocol: {
                    outputFormat: this.format,
                    multi: this.multi
                }
            },
            maxFeatures: this.maxFeatures,
            layer: this.featureLayer,
            ogcFilter: filter,
            autoLoad: autoLoad,
            autoSave: false,
            listeners: {
                "beforewrite": function(store, action, rs, options) {
                    this.fireEvent("beforesave", this, store, options.params);
                },
                "write": function(store, action, result, res, rs) {
                    this.redrawMatchingLayers(record);
                },
                "load": function(store, rs, options) {
                    this.fireEvent("query", this, store, this.filter);
                },
                scope: this
            }
        }, protocolOptions));
        this.fireEvent("layerchange", this, record, schema);
    },
    
    /** private: method[setFeatureStore]
     *  :arg filter: ``OpenLayers.Filter``
     *  :arg autoLoad: ``Boolean``
     * 
     *  Adds WFS and WMS compatibility when has been added dynamically to the map 
     */
    setFeatureStore: function(filter, autoLoad) {
        var record = this.layerRecord;
        var source = this.target.getSource(record);
        if (source && source instanceof gxp.plugins.WMSSource
                || record.getLayer() instanceof OpenLayers.Layer.WMS) {
            this.getSchemaFromWMS(filter, autoLoad, record, source); 
        } else if(!!record.getLayer() 
            && !!record.getLayer().protocol
            && !!record.getLayer().protocol.CLASS_NAME
            && !!record.getLayer().protocol.CLASS_NAME.match("OpenLayers.Format.WFS")
            && record.getLayer().protocol.CLASS_NAME.match("OpenLayers.Format.WFS").length == 1){
            this.getSchemaFromWFS(filter, autoLoad, record, source);
        } else {
            this.clearFeatureStore();
            this.fireEvent("layerchange", this, record, false);
        }        
    }
    
});

/**
 * Paging types
 */
PersistenceGeo.widgets.FeatureManager.QUADTREE_PAGING = 0;
gxp.plugins.FeatureManager.WFS_PAGING = 1;

Ext.preg(PersistenceGeo.widgets.FeatureManager.prototype.ptype, PersistenceGeo.widgets.FeatureManager);
