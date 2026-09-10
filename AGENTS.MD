Do:

use strict TypeScript
use explicit domain types
keep Electron main/preload/renderer boundaries clean
isolate raw Bible JSON parsing behind an adapter
keep presentation state independent from Bible storage
use IPC for cross-window communication
make the secondary display a real Electron BrowserWindow
use reveal.js for presentation mechanics
keep components small and composable
make Bible translations data-driven

Don't:

put raw Bible JSON handling inside React components
access Node APIs from the renderer
couple Bible models directly to reveal.js
make reveal.js the application's data model
introduce a database yet
introduce Redux or another heavyweight state architecture without need
build the presentation editor in the first milestone
build authentication/cloud sync
hardcode KJV-specific assumptions into the UI
create a complicated plugin architecture prematurely


┌──────────────────────────────────────────────────────────────┐
│ Bible Presenter                         Bible: [KJV ▼]       │
├──────────────┬────────────────┬──────────────────────────────┤
│ BOOKS        │ CHAPTERS       │ VERSES                       │
│              │                │                              │
│ Genesis      │ 1              │ 1  In the beginning...      │
│ Exodus       │ 2              │ 2  And the earth was...     │
│ Leviticus    │ 3              │ 3  And God said...          │
│ Numbers      │ 4              │                              │
│ Deuteronomy  │ ...            │ 16 In the beginning...      │
│ ...          │                │                              │
└──────────────┴────────────────┴──────────────────────────────┘

                         ↓ click verse

                 Electron IPC message

                         ↓

┌──────────────────────────────────────────────────────────────┐
│                    SECONDARY DISPLAY                         │
│                                                              │
│                                                              │
│                         JOHN 3:16                             │
│                                                              │
│             For God so loved the world,                      │
│             that he gave his only begotten                    │
│             Son, that whosoever believeth                     │
│             in him should not perish, but                     │
│             have everlasting life.                            │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘

The key architectural objective is that the first version proves the presentation pipeline without prematurely building the entire application:

                ┌──────────────────┐
                │  Bible JSON      │
                └────────┬─────────┘
                         ↓
                ┌──────────────────┐
                │ Bible Repository │
                └────────┬─────────┘
                         ↓
                ┌──────────────────┐
                │   React Browser  │
                └────────┬─────────┘
                         │
                    BiblePassage
                         │
                         ↓
                   Electron IPC
                         │
                         ↓
                ┌──────────────────┐
                │ Presentation     │
                │ React + reveal   │
                └────────┬─────────┘
                         ↓
                  Secondary Display
                  
                  
                  
Once that pipeline works, search, passage ranges, presentation queues, notes, service plans, cross-references, keyboard control, and richer presenter controls can all be layered onto it without changing the fundamental architecture.
