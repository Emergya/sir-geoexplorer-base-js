/*!
 * Ext JS Library 3.4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
/** 
 * @class Ext.ux.grid.filter.MapFilter
 * @extends Ext.ux.grid.filter.Filter
 * Filter by a configurable map of Ext.form.TextField
 * <p><b><u>Example Usage:</u></b></p>
 * <pre><code>    
var filters = new Ext.ux.grid.GridFilters({
    ...
    filters: [{
        // required configs
        type: 'map',
        dataIndex: 'name',
        
        // optional configs
        value: 'foo',
        active: true, // default is false
        iconCls: 'ux-gridfilter-text-icon' // default
        // any Ext.form.TextField configs accepted
    }]
});
 * </code></pre>
 */
Ext.ux.grid.filter.MapFilter = Ext.extend(Ext.ux.grid.filter.StringFilter, {

    /**
     * Default string
     */
    validationElementsType: 'string',

    /**
     * Template method that is to validate the provided Ext.data.Record
     * against the filters configuration.
     * @param {Ext.data.Record} record The record to validate
     * @return {Boolean} true if the record is valid within the bounds
     * of the filter, false otherwise.
     */
    validateRecord : function (record) {
        var mapVal = record.get(this.dataIndex);

        for(var val in mapVal){
            if(this.validateRecordVal(val)){
                return true;
            }
        }

        return false;
    },

    VALIDATION_TYPES: {
        /**
         * Validation string
         **/
        string: function (val, self_) {
            if(typeof val != 'string') {
                return (self_.getValue().length === 0);
            }
            return val.toLowerCase().indexOf(self_.getValue().toLowerCase()) > -1;
        }
    },

    validateRecordVal: function(val){
        if(!!this.VALIDATION_TYPES[this.validationElementsType] 
            && this.VALIDATION_TYPES[this.validationElementsType](val, this)){
                return true;
        }else{
            return false;
        }
    }
});
