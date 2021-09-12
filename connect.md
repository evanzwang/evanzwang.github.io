---
title: Connect AI
nav_title: Connect AI
width: 
category: projects
reading_time: False
summary: Developed an enviroment to train models to play "connect" games like Five-in-a-Row, Tic-Tac-Toe, and Connect-4. **Click [here](/connect-game) to play against the trained agent (Five-in-a-Row).**
order: 1
---

## Overview

The overall algorithm was inspired by [AlphaGo Zero](https://www.nature.com/articles/nature24270.epdf?author_access_token=VJXbVjaSHxFoctQQ4p2k4tRgN0jAjWel9jnR3ZoTv0PVW4gB86EEpGqTRDtpIz-2rmo8-KG06gqVobU5NSCFeHILHcVFUeMsbvwS-lxjqQGg98faovwjxeTUgZAUMnRQ) and [AlphaZero](https://arxiv.org/pdf/1712.01815.pdf).

The overall training environment and pipeline was written using Python; the neural networks were from PyTorch. ONNX.js was used to port the neural networks into JavaScript.

You can play against a trained agent for Five-in-a-Row on a 10x10 board [here](/connect-game).

The code (for training and low-level gameplay) can be found at <https://github.com/evanzwang/connect-ai>.

## Details

### Selecting an Action

The agent uses a modified Monte-Carlo Tree Search (MCTS) algorithm as specified in AlphaZero.

The algorithm creates a tree of possible game states. When it sees a new state, the neural network is used to predict a state value and search probabilities. Then, the search stops and some information is propagated back up the tree.

- **Value**: the estimated chance of the current player winning (1 if the player will win from the current state, -1 if the player will lose).
- **Probabilities**: values from 0 to 1 (corresponding to each possible action) specifying which moves are most likely to result in a win.

However, if the state has already been visited (the neural network has already predicted the state's value and move probabilities), the algorithm selects a further move to play. The algorithm then runs on this new board state, until it reaches a state it hasn't seen before.

- To select the move to play, the algorithm selects the action that both explores the moves with high search probabilities and high state values. (To be specific, it selects the action that maximizes a given expression, which is a function of the state's probabilities and values.)

The above search algorithm is then run for a specified number of iterations *(set to be around 250)*. The action that was visited the most is selected as the actual move to play.

### Training the Network

To train the neural network (from the previous section), data is obtained from many games of self-play, where the same agent plays for both sides *(around 8,000 games)*. Every move, three things are stored:

1. The board state
2. Whether the player who made the action won (in the end)
3. The counts of the MCTS selected actions (remember that in each iteration, the MCTS algorithm selects actions to explore with a high chance of a good outcome)

After a set amount of games *(10 games)*, the neural network parameters are updated with backpropagation using the data collected. First, the board state is fed into the neural network, and it outputs the state value and search probabilities for that specific board state. Then, the neural network's value (ranging from -1 to 1) is trained to match 1 if the player won, and -1 if the player lost (mean-squared error). The neural network's output probabilities are trained to match the ratio of the counts of the selected actions (cross-entropy).
