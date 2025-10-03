"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStop = void 0;
const server_1 = require("../server");
/**
 * Creates a new stop for a journey
 * Validates required fields and automatically assigns the next order position
 */
const createStop = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const { title, note, image_url } = req.body;
        // Validate required fields
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!image_url) {
            return res.status(400).json({ error: 'Image URL is required' });
        }
        // Verify the parent journey exists before creating the stop
        const journey = await server_1.prisma.journey.findUnique({
            where: { id: journeyId }
        });
        if (!journey) {
            return res.status(404).json({ error: 'Journey not found' });
        }
        // Calculate the order position for the new stop
        // This ensures stops are added sequentially (1, 2, 3, etc.)
        const existingStopsCount = await server_1.prisma.stop.count({
            where: { journeyId }
        });
        const newOrder = existingStopsCount + 1;
        // Create the new stop with calculated order position
        const stop = await server_1.prisma.stop.create({
            data: {
                title,
                note,
                image_url,
                order: newOrder,
                journeyId
            }
        });
        // Return the created stop data
        res.status(201).json({
            id: stop.id,
            title: stop.title,
            note: stop.note,
            image_url: stop.image_url,
            order: stop.order,
            journeyId: stop.journeyId
        });
    }
    catch (error) {
        console.error('Error creating stop:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createStop = createStop;
