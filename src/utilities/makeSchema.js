/* @flow */
/**
 *  Copyright (c) 2016, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { parse } from '../language';
import invariant from '../jsutils/invariant';
import { GraphQLSchema } from '../type/schema';
import { GraphQLObjectType } from '../type/definition';
import { buildASTSchema } from './buildASTSchema';

/**
 * makeSchema is a helper function to make it easier to create a GraphQL
 * schema. It creates a schema by taking a set of types, defined in
 * GraphQL schema language. In this set of types, the types Query and
 * Mutation are special, defining the root types for the basic query
 * and mutation operations if they are defined in the set of types.
 * The `query` and `mutation` fields of the config provide the singleton
 * objects for their types.
 *
 * When you use makeSchema, you cannot specify custom resolvers; you
 * can only use the default resolver behavior.
 *
 * Example:
 *
 * const types = `
 *   type Person {
 *     id: Int
 *     name: String
 *   }
 *   type Query {
 *     person(id: Int)
 *   }
 * `;
 *
 * const query = {
 *   // Returns a promise for an object with id and name fields
 *   person({id}, context) {
 *     return context.database.getPerson({id});
 *   }
 * };
 *
 * const schema = makeSchema({types, query});
 *
 */
export function makeSchema(config: MakeSchemaConfig) {
  invariant(
    typeof config === 'object',
    'You must call makeSchema with a config object.'
  );
  invariant(
    typeof config.types === 'string',
    'When calling makeSchema(config), config.types must be a string.'
  );
  invariant(
    !config.query || typeof config.query === 'object',
    'When calling makeSchema(config), config.query must be an object ' +
    'if it is provided.'
  );
  invariant(
    !config.mutation || typeof config.mutation === 'object',
    'When calling makeSchema(config), config.mutation must be an object ' +
    'if it is provided.'
  );
  invariant(
    config.query || config.mutation,
    'When calling makeSchema(config), at least one of config.query ' +
    'and config.mutation must be provided.'
  );

  let schemaDoc: string = config.types;

  // TODO: probably error messages are nicer if we operate on the AST
  // rather than appending to the schema document like this
  if (config.query) {
    if (config.mutation) {
      schemaDoc += 'schema { query: Query, mutation: Mutation }';
    } else {
      schemaDoc += 'schema { query: Query }';
    }
  } else {
    schemaDoc += 'schema { mutation: Mutation }';
  }
  const ast = parse(schemaDoc);
  const schemaWithNoResolvers = buildASTSchema(ast);
  const schemaConfig = schemaWithNoResolvers.getConfig();

  if (config.query) {
    const queryConfig = schemaWithNoResolvers.getQueryType().getConfig();
    queryConfig.fields = addResolvers(config.query, queryConfig.fields);
    schemaConfig.query = new GraphQLObjectType(queryConfig);
  }
  if (config.mutation) {
    const mutationConfig = schemaWithNoResolvers.getMutationType()
                                                .getConfig();
    mutationConfig.fields = addResolvers(
      config.mutation, mutationConfig.fields);
    schemaConfig.mutation = new GraphQLObjectType(mutationConfig);
  }

  const schema = new GraphQLSchema(schemaConfig);
  console.log('XXX new schema:', schema);
  return schema;
}

// Returns a new field config map where the resolver for
// fieldConfigMap[foo] is now resolverMap[foo].
function addResolversToFieldConfigMap(resolverMap, fieldConfigMap) {
  const newFieldConfigMap = {};
  for (let fieldName in fieldConfigMap) {
    newFieldConfigMap[fieldName] = {
      ...fieldConfigMap,
      resolve: resolverMap[fieldName]
    };
  }
  return newFieldConfigMap;
}

type MakeSchemaConfig = {
  types: string;
  query?: any;
  mutation?: any;
}
