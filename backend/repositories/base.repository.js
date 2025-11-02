class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  // Create
  async create(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw new Error(`Create operation failed: ${error.message}`);
    }
  }

  // Create many
  async createMany(dataArray) {
    try {
      return await this.model.insertMany(dataArray);
    } catch (error) {
      throw new Error(`Bulk create operation failed: ${error.message}`);
    }
  }

  // Find by ID
  async findById(id, populate = '') {
    try {
      const query = this.model.findById(id);
      if (populate) {
        query.populate(populate);
      }
      return await query.exec();
    } catch (error) {
      throw new Error(`Find by ID operation failed: ${error.message}`);
    }
  }

  // Find one with conditions
  async findOne(conditions, projection = {}, options = {}) {
    try {
      return await this.model.findOne(conditions, projection, options).exec();
    } catch (error) {
      throw new Error(`Find one operation failed: ${error.message}`);
    }
  }

  // Find all with optional conditions
  async find(conditions = {}, projection = {}, options = {}) {
    try {
      const { sort, limit, skip, populate } = options;
      const query = this.model.find(conditions, projection);

      if (sort) query.sort(sort);
      if (limit) query.limit(limit);
      if (skip) query.skip(skip);
      if (populate) query.populate(populate);

      return await query.exec();
    } catch (error) {
      throw new Error(`Find operation failed: ${error.message}`);
    }
  }

  // Find with pagination
  async findWithPagination(conditions = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
        projection = {},
        populate = '',
      } = options;

      const skip = (page - 1) * limit;

      const query = this.model
        .find(conditions, projection)
        .sort(sort)
        .limit(limit)
        .skip(skip);

      if (populate) {
        query.populate(populate);
      }

      const [data, total] = await Promise.all([
        query.exec(),
        this.model.countDocuments(conditions),
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Paginated find operation failed: ${error.message}`);
    }
  }

  // Update by ID
  async updateById(id, updateData, options = {}) {
    try {
      const defaultOptions = { new: true, runValidators: true };
      return await this.model.findByIdAndUpdate(
        id,
        updateData,
        { ...defaultOptions, ...options }
      );
    } catch (error) {
      throw new Error(`Update by ID operation failed: ${error.message}`);
    }
  }

  // Update one
  async updateOne(conditions, updateData, options = {}) {
    try {
      const defaultOptions = { new: true, runValidators: true };
      return await this.model.findOneAndUpdate(
        conditions,
        updateData,
        { ...defaultOptions, ...options }
      );
    } catch (error) {
      throw new Error(`Update one operation failed: ${error.message}`);
    }
  }

  // Update many
  async updateMany(conditions, updateData) {
    try {
      return await this.model.updateMany(conditions, updateData);
    } catch (error) {
      throw new Error(`Update many operation failed: ${error.message}`);
    }
  }

  // Delete by ID
  async deleteById(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Delete by ID operation failed: ${error.message}`);
    }
  }

  // Delete one
  async deleteOne(conditions) {
    try {
      return await this.model.findOneAndDelete(conditions);
    } catch (error) {
      throw new Error(`Delete one operation failed: ${error.message}`);
    }
  }

  // Delete many
  async deleteMany(conditions) {
    try {
      return await this.model.deleteMany(conditions);
    } catch (error) {
      throw new Error(`Delete many operation failed: ${error.message}`);
    }
  }

  // Count documents
  async count(conditions = {}) {
    try {
      return await this.model.countDocuments(conditions);
    } catch (error) {
      throw new Error(`Count operation failed: ${error.message}`);
    }
  }

  // Check if exists
  async exists(conditions) {
    try {
      const count = await this.model.countDocuments(conditions);
      return count > 0;
    } catch (error) {
      throw new Error(`Exists check failed: ${error.message}`);
    }
  }

  // Aggregate
  async aggregate(pipeline) {
    try {
      return await this.model.aggregate(pipeline);
    } catch (error) {
      throw new Error(`Aggregate operation failed: ${error.message}`);
    }
  }

  // Find distinct values
  async distinct(field, conditions = {}) {
    try {
      return await this.model.distinct(field, conditions);
    } catch (error) {
      throw new Error(`Distinct operation failed: ${error.message}`);
    }
  }

  // Bulk write operations
  async bulkWrite(operations) {
    try {
      return await this.model.bulkWrite(operations);
    } catch (error) {
      throw new Error(`Bulk write operation failed: ${error.message}`);
    }
  }

  // Upsert (update or insert)
  async upsert(conditions, data) {
    try {
      return await this.model.findOneAndUpdate(
        conditions,
        { $set: data },
        { upsert: true, new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Upsert operation failed: ${error.message}`);
    }
  }
}

module.exports = BaseRepository;