/**
 * Category entity - top-level workspace containers
 */
export class Category {
  constructor({
    id = crypto.randomUUID(),
    title = '',
    order = 0,
    createdAt = Date.now(),
    updatedAt = Date.now()
  } = {}) {
    this.id = id;
    this.title = title;
    this.order = order;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  touch() {
    this.updatedAt = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      order: this.order,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(data) {
    return new Category(data);
  }
}
