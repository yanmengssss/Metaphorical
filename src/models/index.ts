/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import mongoose, { Schema, Document, Model } from 'mongoose';

// --- Project Schema ---
export interface IProject extends Document {
  name: string;
  key: string;
  status: 'active' | 'banned';
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'banned'], default: 'active' },
}, { timestamps: true });

// --- Table Schema ---
export interface ITableColumn {
  key: string;
  value: string; // Display label for the column? User said "key, value, type, default". Maybe value is description? Or user meant "Label"? User said "key, label(table name), messageType... then create/edit content... key, value, type, default".
  // Let's assume user meant defining fields: key (field name), label (display name), type, default.
  // Wait, user said "key, value, type, default". Maybe "value" is the label? Or fixed value?
  // Let's stick to "key", "label" (for display), "type", "defaultValue".
  type: string;
  defaultValue?: any;
  enumOptions?: { key: string; label: string }[];
}

export interface IMessageType {
  key: string;
  label: string;
}

export interface ITable extends Document {
  project: mongoose.Types.ObjectId;
  key: string; // Table unique identifier within project
  label: string; // Table display name
  messageTypes: IMessageType[];
  columns: ITableColumn[];
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema: Schema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  key: { type: String, required: true },
  label: { type: String, required: true },
  messageTypes: [{
    key: { type: String, required: true },
    label: { type: String, required: true }
  }],
  columns: [{
    key: { type: String, required: true },
    label: { type: String, required: false }, // Mapping "value" to label/description
    type: { type: String, required: true }, // string, number, date, boolean
    defaultValue: { type: Schema.Types.Mixed },
    enumOptions: [{
      key: { type: String },
      label: { type: String }
    }]
  }]
}, { timestamps: true });

// Ensure unique table key per project
TableSchema.index({ project: 1, key: 1 }, { unique: true });


// --- Log Schema ---
export interface ILog extends Document {
  project: mongoose.Types.ObjectId;
  table: mongoose.Types.ObjectId;
  data: Record<string, any>; // The dynamic content based on table columns
  messageType: string; // One of the keys in Table.messageTypes
  createdAt: Date; // Timestamp
}

const LogSchema: Schema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  table: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
  data: { type: Schema.Types.Mixed, required: true },
  messageType: { type: String, required: true },
}, { timestamps: true }); // timestamps handles createdAt

// Indexes for searching
LogSchema.index({ project: 1, createdAt: -1 });
LogSchema.index({ table: 1, createdAt: -1 });
LogSchema.index({ messageType: 1 });


export const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
export const Table: Model<ITable> = mongoose.models.Table || mongoose.model<ITable>('Table', TableSchema);
export const Log: Model<ILog> = mongoose.models.Log || mongoose.model<ILog>('Log', LogSchema);

