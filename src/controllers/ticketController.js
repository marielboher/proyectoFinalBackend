import TicketService from "../services/ticketSrvice.js";

class TicketController {
    constructor() {
      this.ticketService = new TicketService();
    }
  
    async createTicket(ticketData) {
      if (!ticketData) {
          console.error('Datos del ticket no proporcionados');
          throw new Error('Datos del ticket no proporcionados');
        }
      try {
          const ticket = await this.ticketService.createTicket(ticketData);
  
          if (ticket) {
              return ticket;  
          } else {
              throw new Error("Error al crear el ticket");
          }
      } catch (error) {
          console.error('Error específico en la creación del ticket:', error);
          throw error;  
      }
    }

    async getTicketById(ticketId) {
        try {
          const ticket = await this.ticketService.getTicketById(ticketId);
    
          if (!ticket) {
            throw new Error("Ticket no encontrado");
          }
    
          return ticket;
        } catch (error) {
          console.error("Error al obtener el ticket:", error);
          throw error;
        }
      }
  }
  
  export default new TicketController();
  