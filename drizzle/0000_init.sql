CREATE TABLE "departures" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(24) NOT NULL,
	"message" varchar(80) NOT NULL,
	"destination" varchar(32) NOT NULL,
	"platform" integer NOT NULL,
	"region" varchar(32) NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "departures_created_at_idx" ON "departures" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "departures_destination_idx" ON "departures" USING btree ("destination");