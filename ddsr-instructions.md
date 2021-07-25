---
title: Instructions for DDSR
hide_in_nav: True
category: projects
width: fluid
reading_time: False
summary: Instructions to run/train the DDSR models.
---

## Environment Setup

1. [Install](https://docs.conda.io/projects/conda/en/latest/user-guide/install/) Anaconda. You can install Miniconda if space is limited.
2. Create your `ddsr` anaconda environment where you will be doing development. In terminal:

    ```console
    conda env create -f ddsr_environment.yml
    ```

3. Activate `ddsr` anaconda environment:

    ```console
    conda activate ddsr
    ```

4. Install PyTorch (find the specific command to run here: <https://pytorch.org/>)

    ```console
    conda install pytorch ...
    ```

## Downloading Data

1. Download the KITTI dataset with the following command: (Warning: this takes up around 175 GB)

    ```console
    wget -i splits/kitti_dataset_download.txt -P data/kitti_data/
    ```

2. Unzip with :

    ```console
    cd kitti_data
    unzip "*.zip"
    ```

3. Convert the PNG images to JPEG (OPTIONAL — speeds up training time)

    ```console
    find kitti_data/ -name '*.png' | parallel 'convert -quality 92 -sampling-factor 2x2,1x1,1x1 {.}.png {.}.jpg && rm {}'
    ```

4. Download the KITTI ground truth depth maps (Warning: this takes up around 14 GB)

    ```console
    wget -i splits/kitti_depth_maps_download.txt -P data/kitti_gt/
    ```

5. Unzip with

    ```console
    cd kitti_gt
    unzip "*.zip"
    ```

## Preparing Evaluation Data

1. Export LiDAR ground truth depth with:

    ```console
    python export_gt_depth.py --split_path splits/eigen_test.txt --gt_depth_dir data/kitti_data --output_dir data/kitti_gt --use_lidar True  
    ```

2. Export KITTI ground truth depth maps with:

    ```console
    python export_gt_depth.py --split_path splits/eigen_benchmark_test.txt --gt_depth_dir data/kitti_gt/data_depth_annotated --output_dir data/kitti_gt
    ```

*Note: If you plan to run metrics while training, this must be done before training.*

## Training From Scratch

1. Select an existing config from the `configs` folder OR Create a config with the following format:

    ```yaml
    num_epochs: [int, number of epochs that the model will train for]
    learning_rate: [int, the learning rate]
    scheduler_step_size: [int, learning rate scheduler step size]
    weight_decay: [int, weight decay factor for learning rate scheduler]
    batch_size: [int, batch size]
    num_workers: [int, number of workers for multi-process data loading]
    use_monocular: [boolean, specifies whether or not to use monocular data]
    use_stereo: [boolean, specifies whether or not to use stereo data]
    min_depth: [float, minimum bound for depth predictions]
    max_depth: [float, maximum bound for depth predictions]
    num_scales: [int, number of scales used for multiscalar loss]
    tensorboard_step: [int, step size for logging images to tensorboard]
    metrics: [boolean, specifies whether or not to calculate metrics while training]
    log_dir: [string, path to directory where results will be logged]
    gt_dir: [string, path to directory containing ground truth depth data]

    depth_network:
      layers: [int, Resnet - 18 or 50; Densenet - 121, 169, 201, or 161)]
      densenet: [boolean, specifies whether to use a densenet encoder; default is resnet]
      fpn: [boolean, specifies whether or ont to use a feature pyramid network]
      pretrained: [boolean, specifies whether or not to use weights pretrained on imageNet]

    pose_network: (section not needed for stereo only models)
      layers: [int, Resnet - 18, 50; Densenet - 121, 169, 201, 161)]
      densenet: [boolean, specifies whether to use a densenet encoder; default is resnet]
      pretrained: [boolean, specifies whether or not to use weights pretrained on imageNet]

    image:
      width: [int, width of image]
      height: [int, height of image]
      color: [string, color model used during training (RGB/HSV)]

    dataset_config_paths:
      train: [string, path to training dataset config]
      val: [string, path to validation dataset config]
      test_lidar: [string, path to testing dataset config (ground truth from LiDAR points)]
      test_gt_map: [string, path to testing dataset config (ground truth from KITTI dataset depth maps)]
      qual: [Optional -- string, path to qualitative dataset config]
      gif: [Optional -- string, path to gif dataset config]
    ```

2. Train with:

    ```console
    python trainer.py --config_path [path to training config]
    ```

## Training From an Existing Checkpoint

1. Locate an existing experiment folder.
2. Train with:

    ```console
    python trainer.py --config_path [path to training config within an experiment folder] --epoch [epoch to continue training from]
    ```

*Note: `--epoch 1` will load the weights from the first checkpoint and begin training from epoch 2.*

## Evaluation

1. Evaluate metrics on LiDAR data with:

    ```console
    python monodepth_metrics.py --exp_dir [path to experiment directory] --epoch [epoch/checkpoint number] --use_lidar
    ```

2. Evaluate metrics on KITTI ground truth depth maps with:

    ```console
    python monodepth_metrics.py --exp_dir [path to experiment directory] --epoch [epoch/checkpoint number]
    ```

*Note: Replace `--epoch` with `--all_epochs` to evaluate metrics on ALL checkpoints in specified experiment directory*
