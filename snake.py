"""
Mini Snake Game - Desktop Edition (Python / Tkinter)
No external dependencies required! Runs directly with standard Python.

Controls:
  - Arrow Keys or W / A / S / D : Move snake
  - Space : Pause / Resume
  - R : Restart game
"""

import tkinter as tk
import random

CELL_SIZE = 20
GRID_WIDTH = 20
GRID_HEIGHT = 20
CANVAS_WIDTH = CELL_SIZE * GRID_WIDTH
CANVAS_HEIGHT = CELL_SIZE * GRID_HEIGHT
INITIAL_SPEED = 100  # Milliseconds per frame


class SnakeGame:
    def __init__(self, root):
        self.root = root
        self.root.title("🐍 Mini Snake")
        self.root.resizable(False, False)
        self.root.configure(bg="#0b0f19")

        # Game state
        self.score = 0
        self.high_score = 0
        self.running = False
        self.paused = False
        self.snake = []
        self.direction = "Right"
        self.next_direction = "Right"
        self.food = None
        self.timer_id = None

        # UI Layout
        self._create_header()
        self._create_canvas()
        self._create_footer()

        # Key Bindings
        self.root.bind("<KeyPress>", self._handle_keypress)

        # Start game
        self.restart()

    def _create_header(self):
        header = tk.Frame(self.root, bg="#131b2e", padx=16, pady=10)
        header.pack(fill=tk.X)

        self.score_label = tk.Label(
            header,
            text="SCORE: 0",
            font=("Helvetica", 12, "bold"),
            fg="#38bdf8",
            bg="#131b2e",
        )
        self.score_label.pack(side=tk.LEFT, padx=10)

        self.high_score_label = tk.Label(
            header,
            text="BEST: 0",
            font=("Helvetica", 12, "bold"),
            fg="#f59e0b",
            bg="#131b2e",
        )
        self.high_score_label.pack(side=tk.RIGHT, padx=10)

    def _create_canvas(self):
        self.canvas = tk.Canvas(
            self.root,
            width=CANVAS_WIDTH,
            height=CANVAS_HEIGHT,
            bg="#0d1322",
            highlightthickness=2,
            highlightbackground="#38bdf8",
        )
        self.canvas.pack(padx=16, pady=12)

    def _create_footer(self):
        footer = tk.Label(
            self.root,
            text="Arrows / WASD to Move  •  Space to Pause  •  R to Restart",
            font=("Helvetica", 9),
            fg="#94a3b8",
            bg="#0b0f19",
            pady=8,
        )
        footer.pack()

    def restart(self):
        if self.timer_id:
            self.root.after_cancel(self.timer_id)

        self.snake = [(8, 10), (7, 10), (6, 10)]
        self.direction = "Right"
        self.next_direction = "Right"
        self.score = 0
        self.running = True
        self.paused = False
        self.score_label.config(text="SCORE: 0")

        self._spawn_food()
        self._game_loop()

    def _spawn_food(self):
        while True:
            fx = random.randint(0, GRID_WIDTH - 1)
            fy = random.randint(0, GRID_HEIGHT - 1)
            if (fx, fy) not in self.snake:
                self.food = (fx, fy)
                break

    def _handle_keypress(self, event):
        key = event.keysym.lower()

        # Direction changes
        opposites = {"up": "down", "down": "up", "left": "right", "right": "left"}
        key_map = {
            "up": "Up", "w": "Up",
            "down": "Down", "s": "Down",
            "left": "Left", "a": "Left",
            "right": "Right", "d": "Right"
        }

        if key in key_map:
            desired = key_map[key]
            current_opp = opposites.get(self.direction.lower())
            if desired.lower() != current_opp and desired != self.direction:
                self.next_direction = desired

        # Pause
        elif key == "space":
            if self.running:
                self.paused = not self.paused
                if not self.paused:
                    self._game_loop()
                else:
                    self._draw_overlay("PAUSED", "Press Space to resume")

        # Restart
        elif key == "r":
            self.restart()

    def _game_loop(self):
        if not self.running or self.paused:
            return

        self.direction = self.next_direction
        dx, dy = 0, 0
        if self.direction == "Up":
            dy = -1
        elif self.direction == "Down":
            dy = 1
        elif self.direction == "Left":
            dx = -1
        elif self.direction == "Right":
            dx = 1

        head_x, head_y = self.snake[0]
        new_head = (head_x + dx, head_y + dy)

        # Check wall collision
        if not (0 <= new_head[0] < GRID_WIDTH and 0 <= new_head[1] < GRID_HEIGHT):
            self._game_over()
            return

        # Check self collision
        if new_head in self.snake:
            self._game_over()
            return

        self.snake.insert(0, new_head)

        # Food check
        if new_head == self.food:
            self.score += 10
            self.score_label.config(text=f"SCORE: {self.score}")
            if self.score > self.high_score:
                self.high_score = self.score
                self.high_score_label.config(text=f"BEST: {self.high_score}")
            self._spawn_food()
        else:
            self.snake.pop()

        self._render()

        # Dynamic speed adjustment
        speed = max(50, INITIAL_SPEED - (self.score // 40) * 5)
        self.timer_id = self.root.after(speed, self._game_loop)

    def _render(self):
        self.canvas.delete("all")

        # Draw grid dots
        for x in range(0, CANVAS_WIDTH, CELL_SIZE):
            for y in range(0, CANVAS_HEIGHT, CELL_SIZE):
                self.canvas.create_rectangle(
                    x, y, x + 1, y + 1, outline="#162036"
                )

        # Draw food
        if self.food:
            fx, fy = self.food
            x1 = fx * CELL_SIZE + 2
            y1 = fy * CELL_SIZE + 2
            x2 = (fx + 1) * CELL_SIZE - 2
            y2 = (fy + 1) * CELL_SIZE - 2
            self.canvas.create_oval(x1, y1, x2, y2, fill="#ef4444", outline="#b91c1c")

        # Draw snake
        for i, (sx, sy) in enumerate(self.snake):
            x1 = sx * CELL_SIZE + 1
            y1 = sy * CELL_SIZE + 1
            x2 = (sx + 1) * CELL_SIZE - 1
            y2 = (sy + 1) * CELL_SIZE - 1

            if i == 0:
                self.canvas.create_rectangle(
                    x1, y1, x2, y2, fill="#4ade80", outline="#22c55e", width=2
                )
            else:
                self.canvas.create_rectangle(
                    x1, y1, x2, y2, fill="#22c55e", outline="#15803d"
                )

    def _draw_overlay(self, title, subtitle):
        self.canvas.create_rectangle(
            0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, fill="#0b0f19", stipple="gray50"
        )
        self.canvas.create_text(
            CANVAS_WIDTH // 2,
            CANVAS_HEIGHT // 2 - 20,
            text=title,
            fill="#ffffff",
            font=("Helvetica", 20, "bold"),
        )
        self.canvas.create_text(
            CANVAS_WIDTH // 2,
            CANVAS_HEIGHT // 2 + 15,
            text=subtitle,
            fill="#94a3b8",
            font=("Helvetica", 11),
        )

    def _game_over(self):
        self.running = False
        self._draw_overlay("GAME OVER", f"Score: {self.score}  •  Press R to Restart")


def main():
    root = tk.Tk()
    game = SnakeGame(root)
    root.mainloop()


if __name__ == "__main__":
    main()
