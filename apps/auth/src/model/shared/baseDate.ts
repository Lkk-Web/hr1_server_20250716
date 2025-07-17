import {AutoIncrement, Column, CreatedAt, Model, PrimaryKey, UpdatedAt} from 'sequelize-typescript';
import { BaseModel } from './base.model';

import { findPagination } from './method';

export class BaseDate<T> extends BaseModel<T> {

  @CreatedAt
  @Column
  // @ts-ignore
  declare createdAt?: Date;

  @UpdatedAt
  @Column
  // @ts-ignore
  declare updatedAt?: Date;
}
