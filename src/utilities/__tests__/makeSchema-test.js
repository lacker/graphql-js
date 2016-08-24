/**
 *  Copyright (c) 2016, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';

import { makeSchema } from '../makeSchema';
import { graphql } from '../../';

describe.only('makeSchema', () => {
  it('works with a query', async () => {
    const types = `
    type Person {
      name: String
    }
    type Query {
      get: Person
    }`;

    const query = {
      get() {
        return {name: 'bob'};
      }
    };
    const schema = makeSchema({types, query});

    expect(
      await graphql(schema, '{ get { name }}')
    ).to.deep.equal({
      data: {
        get: {
          name: 'bob'
        }
      }
    });
  });
});
