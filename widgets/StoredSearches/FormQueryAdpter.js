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
 */

Viewer.plugins.FormQueryAdapter = Ext.extend(Ext.util.Observable, {
    
    formDef: null,

    constructor: function(config) {
        Viewer.plugins.FormQueryAdapter.superclass.constructor.call(this, config);
    },

    parse: function(formDef) {

        var components = [];
        this.formDef = formDef || [];

        for (var i=0, l=this.formDef.length; i<l; i++) {
            var condition = this.parseCondition(this.formDef[i]);
            components.push(condition);
        }

        return components;
    },

    parseCondition: function(condition) {

        var htmlFilters = this.parseFilters(condition);
        var htmlValues = this.parseValues(condition);

        return {
            filters: htmlFilters,
            values: htmlValues,
            onChange: condition.onChange || undefined
        };
    },

    parseProperty: function(condition) {
        return {
            xtype: 'label',
            text: condition.label || condition.property
        };
    },

    parseFilters: function(condition) {
        if (condition.valueReader) {
            return null;
        }
        var filters = [];
        for (var i=0, l=condition.filters.length; i<l; i++) {
            var item = condition.filters[i];
            filters.push([item, item]);
        }
        return {
            xtype: 'combo',
            cls: 'vw-stored-search-field',
            name: condition.property,
            hidden: condition.hidden,
            fieldLabel: !condition.hidden
                ? (condition.label || condition.property)
                : null,
            width: 60,
            triggerAction: 'all',
            editable: false,
            mode: 'local',
            value: condition.filters[0],
            store: new Ext.data.ArrayStore({
                fields: ['id', 'comparison'],
                data: filters
            }),
            valueField: 'id',
            displayField: 'comparison'
        };
    },

    parseValues: function(condition) {
        var component = null;
        if (!condition.valueReader) {
            component = {
                xtype: 'textfield',
                cls: 'vw-stored-search-field',
                name: condition.property,
                value: condition.value || undefined,
                hidden: condition.hidden,
                enableKeyEvents: true,
                anchor: '-20'
            };
        } else {
            component = {
                xtype: 'combo',
                cls: 'vw-stored-search-field',
                name: condition.property,
                hidden: condition.hidden,
                fieldLabel: condition.label || condition.property,
                anchor: '-20',
                triggerAction: 'all',
                editable: false,
                mode: 'local',
                store: condition.valueReader,
                valueField: 'text',
                displayField: 'text',
                valueNotFoundText: 'Seleccione un valor...'
            };
        }
        return component;
    }
});
