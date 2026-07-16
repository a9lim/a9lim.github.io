---
title: Bio-transformer
href: https://github.com/a9lim/bio-transformer
kind: project
order: 50
external: true
icon: projBioformer
seoName: Bio-transformer — Neuromorphic Spiking Transformer
tags:
  - python
  - neuromorphic
  - spiking
shortDesc: Neuromorphic transformer fusing astrocyte, cerebellar, and cortical circuits — every neuron spiking, every weight update local, no backprop.
---
Neuromorphic transformer assembled from three brain subsystems that each independently compute something transformer-shaped: astrocytes (the tripartite synapse) as recurrent linear attention over a decaying-calcium memory matrix, the Marr–Albus cerebellum as the FFN via sparse granule expansion and a Purkinje readout, and laminar neocortex as the residual stream via predictive coding. Every neuron is a leaky integrate-and-fire spiker and every weight update is local — Oja’s rule, Hebbian predictive coding, a climbing-fibre delta rule — with no autograd, backprop, or surrogate gradient anywhere.
