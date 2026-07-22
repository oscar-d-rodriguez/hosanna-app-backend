const eventRepository = require('../repositories/event.repository');
const { AppError } = require('../middleware/error.middleware');

const PRIVILEGED_ROLES = ['admin', 'editor'];

const eventService = {
  async create(data, user) {
    if (!PRIVILEGED_ROLES.includes(user.role)) {
      throw new AppError('Only admins and editors can create events', 403);
    }

    return eventRepository.create({
      ...data,
      createdBy: user.uid,
    });
  },

  async getById(id) {
    const event = await eventRepository.getById(id);
    if (!event) throw new AppError('Event not found', 404);
    return event;
  },

  async list(options) {
    return eventRepository.list(options);
  },

  async update(id, data, user) {
    const event = await eventRepository.getById(id);
    if (!event) throw new AppError('Event not found', 404);

    const isCreator = event.createdBy === user.uid;
    const isPrivileged = PRIVILEGED_ROLES.includes(user.role);

    if (!isCreator && !isPrivileged) {
      throw new AppError('Not authorized to update this event', 403);
    }

    return eventRepository.update(id, data);
  },

  async delete(id, user) {
    const event = await eventRepository.getById(id);
    if (!event) throw new AppError('Event not found', 404);

    if (user.role !== 'admin') {
      throw new AppError('Only admins can delete events', 403);
    }

    await eventRepository.delete(id);
  },
};

module.exports = eventService;
