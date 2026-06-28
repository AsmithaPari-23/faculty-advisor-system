import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('server/data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class MockCollection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  _read() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error(`Error reading mock collection ${this.name}:`, e);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`Error writing mock collection ${this.name}:`, e);
    }
  }

  async find(query = {}) {
    const items = this._read();
    return items.filter(item => {
      for (const key in query) {
        if (query[key] && typeof query[key] === 'object' && '$in' in query[key]) {
          if (!query[key].$in.includes(item[key])) return false;
        } else if (item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const items = await this.find(query);
    return items[0] || null;
  }

  async findById(id) {
    const items = this._read();
    return items.find(item => item._id === id || item.id === id) || null;
  }

  async create(data) {
    const items = this._read();
    const newItem = {
      _id: 'mock_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    items.push(newItem);
    this._write(items);
    return newItem;
  }

  async insertMany(docs) {
    const items = this._read();
    const createdDocs = docs.map(doc => ({
      _id: 'mock_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    }));
    items.push(...createdDocs);
    this._write(items);
    return createdDocs;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;

    const updatedItem = {
      ...items[index],
      ...update,
      updatedAt: new Date().toISOString()
    };
    items[index] = updatedItem;
    this._write(items);
    return updatedItem;
  }

  async findOneAndUpdate(query, update, options = {}) {
    const items = this._read();
    const item = items.find(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    if (!item) {
      if (options.upsert) {
        return this.create({ ...query, ...update });
      }
      return null;
    }
    const index = items.indexOf(item);
    const updatedItem = {
      ...item,
      ...update,
      updatedAt: new Date().toISOString()
    };
    items[index] = updatedItem;
    this._write(items);
    return updatedItem;
  }

  async deleteOne(query) {
    let items = this._read();
    const initialLength = items.length;
    items = items.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return true;
      }
      return false;
    });
    this._write(items);
    return { deletedCount: initialLength - items.length };
  }

  async deleteMany(query = {}) {
    let items = this._read();
    const initialLength = items.length;
    items = items.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return true;
      }
      return false;
    });
    this._write(items);
    return { deletedCount: initialLength - items.length };
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }
}

export const fallbackDb = {
  users: new MockCollection('users'),
  students: new MockCollection('students'),
  faculty: new MockCollection('faculty'),
  attendance: new MockCollection('attendance'),
  marks: new MockCollection('marks'),
  assignments: new MockCollection('assignments'),
  projects: new MockCollection('projects'),
  certifications: new MockCollection('certifications'),
  meetings: new MockCollection('meetings'),
  studentSuccess: new MockCollection('studentSuccess'),
};
