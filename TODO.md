The Problem: You are running the solver iterations inside the nested loop for every pair. 
While this works, it’s much more efficient(and stable for stacks of objects) to:

- Find all collisions and put them in a list(Manifolds).
- Run the solver loop over that list of Manifolds N times.