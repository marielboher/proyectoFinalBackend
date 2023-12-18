import { ticketModel } from "../models/ticket.model.js";

class TicketService {
  async createTicket(data) {
    console.log("Datos del ticket antes de crear:", data);

    if (
      !data.code ||
      !data.purchase_datetime ||
      !data.amount ||
      !data.purchaser
    ) {
      console.error("Datos incompletos:", data);
      throw new Error("Datos incompletos para crear el ticket.");
    }

    const ticket = new ticketModel(data);
    await ticket.save();
    console.log("Ticket creado:", ticket);
    return ticket;
  }

  async getTicketById(ticketId) {
    try {
      const ticket = await ticketModel.findById(ticketId);

      if (!ticket) {
        console.error("Ticket no encontrado con ID:", ticketId);
        return null;
      }

      return ticket;
    } catch (error) {
      console.error("Error al buscar el ticket por ID:", error);
      throw error;
    }
  }
}

export default TicketService;
