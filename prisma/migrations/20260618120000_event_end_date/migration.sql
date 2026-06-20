-- Multi-day events: add an optional end date. eventDate remains the start date.
ALTER TABLE "Event" ADD COLUMN "endDate" TIMESTAMP(3);
